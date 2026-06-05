const fs = require('fs').promises;
const path = require('path');

const roots = [path.join(__dirname, '..', 'data'), path.join(__dirname, '..', 'src', 'data')];

function normalize(s){return (s||'').toLowerCase().replace(/[.,!?"'()\[\]:;]/g,'').trim();}
function tokenize(s){return normalize(s).split(/\W+/).filter(Boolean);} 
function simpleStem(s){return normalize(s).replace(/(ing|ed|ly|es|s|ment|tion|ity|al|ous|ive)$/,'');}
function jaccard(a,b){const sa=new Set(tokenize(a)); const sb=new Set(tokenize(b)); const inter=[...sa].filter(x=>sb.has(x)).length; const uni=new Set([...sa,...sb]).size||1; return inter/uni;}
function levenshtein(a,b){ if(a===b) return 0; const m=a.length, n=b.length; const dp=Array.from({length:m+1},()=>Array(n+1).fill(0)); for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const cost = a[i-1]===b[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost); }} return dp[m][n]; }

async function walk(dir){ let res=[]; try{ const list=await fs.readdir(dir,{withFileTypes:true}); for(const ent of list){ const full=path.join(dir,ent.name); if(ent.isDirectory()) res=res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); }}catch(e){} return res; }

async function buildBank(files){ const bank=new Set(); for(const f of files){ try{ const raw=await fs.readFile(f,'utf8'); const arr=JSON.parse(raw); if(!Array.isArray(arr)) continue; for(const it of arr){ if(Array.isArray(it.choices)) for(const c of it.choices) bank.add(c); }}catch(e){} } return Array.from(bank); }

function tooSimilarToList(candidate, list){ // require token jaccard==0 and stem diff and sufficient edit distance
  for(const x of list){ if(jaccard(candidate,x) > 0) return true; if(simpleStem(candidate) === simpleStem(x)) return true; if(levenshtein(normalize(candidate), normalize(x)) < 4) return true; } return false; }

async function processFile(file, previewRoot, globalBank){ const raw=await fs.readFile(file,'utf8'); let arr; try{ arr=JSON.parse(raw); if(!Array.isArray(arr)) return null; }catch(e){return null;} let changed=0; const used=new Set(); for(const it of arr){ if(Array.isArray(it.choices)) for(const c of it.choices) used.add(normalize(c)); }

 for(const it of arr){ if(!Array.isArray(it.choices) || it.choices.length<2) continue; const choices = it.choices; // check pairwise token overlap or stem overlap
    let problematic=false; for(let i=0;i<choices.length;i++){ for(let j=i+1;j<choices.length;j++){ if(jaccard(choices[i], choices[j])>0 || simpleStem(choices[i])===simpleStem(choices[j])) problematic=true; }} if(!problematic) continue; // already OK
    const correctIndex = (typeof it.answer==='number')? it.answer : 0; const correct = it.choices[correctIndex]; const newChoices=[correct]; const needed = it.choices.length-1;
    // pool candidates that are lexically disjoint from correct and from each other, and not used in same test
    const pool = globalBank.filter(c=> normalize(c)!==normalize(correct));
    for(const cand of pool){ if(newChoices.length>it.choices.length-1+1) break; if(used.has(normalize(cand))) continue; if(jaccard(cand, correct)>0) continue; if(simpleStem(cand)===simpleStem(correct)) continue; if(levenshtein(normalize(cand), normalize(correct))<4) continue; if(tooSimilarToList(cand, newChoices)) continue; newChoices.push(cand); used.add(normalize(cand)); if(newChoices.length===it.choices.length) break; }
    // if not enough, use a fallback bank of unrelated words
    const fallback = ['basket','garden','pencil','ocean','mountain','teacher','library','festival','meal','travel','music','friend','dog','movie','computer','game','planet','river','coffee','museum'];
    let fi=0; while(newChoices.length<it.choices.length){ const cand = fallback[(fi++)%fallback.length]; if(tooSimilarToList(cand,newChoices)) continue; newChoices.push(cand); }
    // shuffle placing correct at random
    const correctPos = Math.floor(Math.random()*it.choices.length);
    const final = new Array(it.choices.length);
    let idx=0; for(let k=0;k<it.choices.length;k++){ if(k===correctPos) final[k]=newChoices[0]; else final[k]=newChoices[++idx]; }
    const newAnswerIndex = correctPos;
    if(JSON.stringify(final)!==JSON.stringify(it.choices) || newAnswerIndex!==correctIndex){ it.choices=final; it.answer=newAnswerIndex; changed++; }
 }
 if(changed>0){ const rel=path.relative(path.join(__dirname,'..'), file); const outPath=path.join(previewRoot, rel); await fs.mkdir(path.dirname(outPath), {recursive:true}); await fs.writeFile(outPath, JSON.stringify(arr, null, 2), 'utf8'); }
 return {file, changed}; }

(async ()=>{
 const filesSet=new Set(); for(const r of roots){ const f=await walk(r); f.forEach(x=>filesSet.add(x)); }
 const files=Array.from(filesSet);
 const globalBank=await buildBank(files);
 const previewRoot=path.join(__dirname,'preview_diverse_strict');
 await fs.rm(previewRoot, {recursive:true, force:true});
 const results = [];
 for(const f of files){ const r = await processFile(f, previewRoot, globalBank); if(r) results.push(r); }
 const changedFiles = results.filter(r=>r.changed>0);
 console.log(`Preview written to ${previewRoot}. Files processed: ${results.length}, files changed: ${changedFiles.length}`);
 for(const r of changedFiles.slice(0,40)) console.log(`${r.file}: ${r.changed}`);
})();
