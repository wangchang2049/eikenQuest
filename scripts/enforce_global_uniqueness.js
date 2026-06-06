const fs = require('fs').promises;
const path = require('path');

function normalize(s){return (s||'').toLowerCase().replace(/[.,!?"'():;\[\]]/g,'').replace(/\s+/g,' ').trim();}
function tokenize(s){return normalize(s).split(/\W+/).filter(Boolean);} 
function simpleStem(s){return normalize(s).replace(/(ing|ed|ly|es|s|ment|tion|ity|al|ous|ive)$/,'');}
function jaccard(a,b){const sa=new Set(tokenize(a)); const sb=new Set(tokenize(b)); const inter=[...sa].filter(x=>sb.has(x)).length; const uni=new Set([...sa,...sb]).size||1; return inter/uni;}
function levenshtein(a,b){ if(a===b) return 0; const m=a.length, n=b.length; const dp=Array.from({length:m+1},()=>Array(n+1).fill(0)); for(let i=0;i<=m;i++)dp[i][0]=i; for(let j=0;j<=n;j++)dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ const cost = a[i-1]===b[j-1]?0:1; dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost); }} return dp[m][n]; }

async function walk(dir){ let res=[]; try{ const list=await fs.readdir(dir,{withFileTypes:true}); for(const ent of list){ const full=path.join(dir,ent.name); if(ent.isDirectory()) res=res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); }}catch(e){} return res; }

(async ()=>{
  const root = path.join(__dirname,'..','data');
  const files = await walk(root);
  const items = [];
  for(const f of files){ try{ const raw=await fs.readFile(f,'utf8'); const arr=JSON.parse(raw); if(!Array.isArray(arr)) continue; for(let i=0;i<arr.length;i++){ items.push({file:f,index:i,item:arr[i]}); }}catch(e){} }

  // build global bank of candidate distractors from all choices
  const globalBankSet = new Set();
  for(const it of items){ const ch = it.item.choices; if(Array.isArray(ch)) for(const c of ch) globalBankSet.add(c); }
  const fallback = [
    'a museum','a concert','a picnic','a football game','a trip','a lecture','a workshop','a party','a movie','a coffee shop',
    'a restaurant','a bookstore','a library','a zoo','a park','a festival','a swimming pool','a train station','a bus stop','a bakery',
    'an exhibit','a playground','a supermarket','a hospital','a bank','a post office','a cinema','a theater','a salon','a gallery',
    'not really','yes, of course','no, I haven\'t','I\'m not sure','maybe later','I don\'t know','definitely','probably not','sometimes','never'
  ];
  const globalBank = Array.from(globalBankSet).concat(fallback);

  // helper to build sorted key (permutation-insensitive)
  function sortedChoicesKey(arr){ return arr.map(c=>normalize(c)).slice().sort().join(' ||| '); }

  // build map of sorted keys
  const keyMap = new Map();
  for(const it of items){ if(Array.isArray(it.item.choices)){ const sk = sortedChoicesKey(it.item.choices); if(!keyMap.has(sk)) keyMap.set(sk, []); keyMap.get(sk).push(it); }}

  const changed = [];
  // track all normalized choices used globally to avoid reuse
  const usedChoices = new Set();
  for(const it of items){ if(Array.isArray(it.item.choices)) for(const c of it.item.choices) usedChoices.add(normalize(c)); }

  // process duplicates: for each key with count>1, keep first, regenerate others
  for(const [sk,list] of keyMap.entries()){
    if(list.length<=1) continue;
    // leave first
    for(let idx=1; idx<list.length; idx++){
      const record = list[idx];
      const q = record.item;
      if(!Array.isArray(q.choices) || q.choices.length<2) continue;
      const correctIndex = (typeof q.answer==='number')? q.answer:0;
      const correct = q.choices[correctIndex];
      const newChoices = [correct];
      // select candidates from globalBank that are lexically disjoint from correct and from usedChoices and from newChoices
      for(const cand of globalBank){ if(newChoices.length>=q.choices.length) break; const n = normalize(cand); if(usedChoices.has(n)) continue; if(jaccard(cand, correct)>0) continue; if(simpleStem(cand)===simpleStem(correct)) continue; if(levenshtein(normalize(cand), normalize(correct))<4) continue; // also ensure cand not similar to any existing newChoices
          let bad=false; for(const nc of newChoices){ if(jaccard(cand,nc)>0 || simpleStem(cand)===simpleStem(nc) || levenshtein(normalize(cand), normalize(nc))<4) { bad=true; break; } } if(bad) continue; newChoices.push(cand); usedChoices.add(n); }
      // if still not enough, use fallback pool (repeat allowed but check similarity)
      let fi=0; while(newChoices.length<q.choices.length){ const cand = fallback[fi++%fallback.length]; const n=normalize(cand); if(usedChoices.has(n)) continue; let bad=false; for(const nc of newChoices){ if(jaccard(cand,nc)>0 || simpleStem(cand)===simpleStem(nc) || levenshtein(normalize(cand), normalize(nc))<4){ bad=true; break; } } if(bad) continue; newChoices.push(cand); usedChoices.add(n); if(fi>fallback.length*3) break; }
      // final guard: if still short, fill with unique tokens using index
      while(newChoices.length<q.choices.length) { const cand = `option_${Date.now()%100000}_${Math.floor(Math.random()*1000)}`; newChoices.push(cand); }
      // place correct randomly
      const correctPos = Math.floor(Math.random()*q.choices.length);
      const final = new Array(q.choices.length);
      let ii=0; for(let k=0;k<q.choices.length;k++){ if(k===correctPos) final[k]=newChoices[0]; else final[k]=newChoices[++ii]; }
      const newAnswerIndex = correctPos;
      // apply
      q.choices = final;
      q.answer = newAnswerIndex;
      changed.push({file: record.file, index: record.index});
    }
  }

  // write preview to scripts/preview_global_unique
  const previewRoot = path.join(__dirname,'preview_global_unique');
  await fs.rm(previewRoot, {recursive:true, force:true});
  // group by file to write JSON
  const byFile = new Map();
  for(const it of items){ const f = it.file; if(!byFile.has(f)) byFile.set(f, []); byFile.get(f)[it.index] = it.item; }
  for(const [f,arr] of byFile.entries()){
    const rel = path.relative(path.join(__dirname,'..'), f);
    const outPath = path.join(previewRoot, rel);
    await fs.mkdir(path.dirname(outPath), {recursive:true});
    await fs.writeFile(outPath, JSON.stringify(arr, null, 2), 'utf8');
  }

  console.log(`Preview written to ${previewRoot}. Items changed: ${changed.length}`);
  for(const c of changed.slice(0,200)) console.log(`${c.file}#${c.index}`);
})();
