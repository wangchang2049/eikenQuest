const fs = require('fs').promises;
const path = require('path');
function normalize(s){return (s||'').toLowerCase().replace(/[.,!?"'():;\[\]]/g,'').replace(/\s+/g,' ').trim();}
function tokenize(s){return normalize(s).split(/\W+/).filter(Boolean);} 
function simpleStem(s){return normalize(s).replace(/(ing|ed|ly|es|s|ment|tion|ity|al|ous|ive)$/,'');}
function jaccard(a,b){const sa=new Set(tokenize(a)); const sb=new Set(tokenize(b)); const inter=[...sa].filter(x=>sb.has(x)).length; const uni=new Set([...sa,...sb]).size||1; return inter/uni;}
async function walk(dir){ let res=[]; try{ const list=await fs.readdir(dir,{withFileTypes:true}); for(const ent of list){ const full=path.join(dir,ent.name); if(ent.isDirectory()) res=res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); }}catch(e){} return res; }
(async ()=>{
  const root = path.join(__dirname,'..','data');
  const files = await walk(root);
  const items = [];
  for(const f of files){ try{ const raw=await fs.readFile(f,'utf8'); const arr=JSON.parse(raw); if(!Array.isArray(arr)) continue; for(let i=0;i<arr.length;i++){ items.push({file:f,index:i,item:arr[i]}); }}catch(e){} }
  const globalBankSet = new Set();
  for(const it of items){ const ch = it.item.choices; if(Array.isArray(ch)) for(const c of ch) globalBankSet.add(c); }
  const fallback = ['a museum','a concert','a picnic','a trip','a lecture','a workshop','a party','a movie','a coffee shop','a restaurant','a bookstore','a library','a zoo','a park','a festival','a swimming pool','a train station','a bus stop','a bakery','not really','yes, of course','no, I haven\'t','I\'m not sure','maybe later','I don\'t know','definitely','probably not','sometimes','never'];
  const globalBank = Array.from(globalBankSet).concat(fallback);
  function sortedChoicesKey(arr){ return arr.map(c=>normalize(c)).slice().sort().join(' ||| '); }
  const keyMap = new Map();
  for(const it of items){ if(Array.isArray(it.item.choices)){ const sk = sortedChoicesKey(it.item.choices); if(!keyMap.has(sk)) keyMap.set(sk, []); keyMap.get(sk).push(it); }}
  const changedFiles = new Map();
  const used = new Set(items.flatMap(it=> (Array.isArray(it.item.choices)? it.item.choices.map(c=>normalize(c)) : [])) );
  for(const [sk,list] of keyMap.entries()){
    if(list.length<=1) continue;
    for(let idx=1; idx<list.length; idx++){
      const rec = list[idx]; const q = rec.item; if(!Array.isArray(q.choices) || q.choices.length<2) continue;
      const correctIndex = (typeof q.answer==='number')? q.answer:0; const correct = q.choices[correctIndex];
      const newChoices=[correct];
      for(const cand of globalBank){ if(newChoices.length>=q.choices.length) break; const n=normalize(cand); if(used.has(n)) continue; if(jaccard(cand,correct)>0) continue; if(simpleStem(cand)===simpleStem(correct)) continue; let bad=false; for(const nc of newChoices){ if(jaccard(cand,nc)>0 || simpleStem(cand)===simpleStem(nc)){ bad=true; break; } } if(bad) continue; newChoices.push(cand); used.add(n); }
      let fi=0; while(newChoices.length<q.choices.length){ const cand = fallback[fi++%fallback.length]; const n=normalize(cand); if(used.has(n)) { if(fi>fallback.length*2) break; else continue;} let bad=false; for(const nc of newChoices){ if(jaccard(cand,nc)>0 || simpleStem(cand)===simpleStem(nc)){ bad=true; break; } } if(bad) { if(fi>fallback.length*2) break; else continue; } newChoices.push(cand); used.add(n); }
      while(newChoices.length<q.choices.length){ const cand = `option_${Date.now()%100000}_${Math.floor(Math.random()*1000)}`; newChoices.push(cand); }
      const correctPos = Math.floor(Math.random()*q.choices.length);
      const final = new Array(q.choices.length); let ii=0; for(let k=0;k<q.choices.length;k++){ if(k===correctPos) final[k]=newChoices[0]; else final[k]=newChoices[++ii]; }
      q.choices = final; q.answer = correctPos; changedFiles.set(rec.file,true);
    }
  }
  const previewRoot = path.join(__dirname,'preview_global_unique_fast');
  await fs.rm(previewRoot,{recursive:true,force:true});
  const byFile = new Map();
  for(const it of items){ const f = it.file; if(!byFile.has(f)) byFile.set(f, []); byFile.get(f)[it.index] = it.item; }
  for(const [f,arr] of byFile.entries()){
    if(!changedFiles.has(f)) continue; const rel = path.relative(path.join(__dirname,'..'), f); const outPath = path.join(previewRoot, rel); await fs.mkdir(path.dirname(outPath), {recursive:true}); await fs.writeFile(outPath, JSON.stringify(arr, null, 2), 'utf8'); }
  console.log(`Preview written to ${previewRoot}. files changed: ${changedFiles.size}`);
})();
