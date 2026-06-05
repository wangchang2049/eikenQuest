const fs = require('fs').promises;
const path = require('path');

const roots = [path.join(__dirname, '..', 'data'), path.join(__dirname, '..', 'src', 'data')];

function normalize(s){
  return (s||'').toLowerCase().replace(/[.,!?"'()]/g,'').trim();
}

function tokenize(s){
  return normalize(s).split(/\W+/).filter(Boolean);
}

function jaccard(a,b){
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const inter = [...sa].filter(x=>sb.has(x)).length;
  const uni = new Set([...sa,...sb]).size || 1;
  return inter/uni;
}

function simpleStem(s){
  // naive stemming: remove common suffixes
  return normalize(s).replace(/(ing|ed|ly|es|s|ment|tion|ity|al|ous|ive)$/,'');
}

async function walk(dir){
  let res = [];
  try{
    const list = await fs.readdir(dir, { withFileTypes: true });
    for(const ent of list){
      const full = path.join(dir, ent.name);
      if(ent.isDirectory()) res = res.concat(await walk(full));
      else if(ent.isFile() && full.endsWith('.json')) res.push(full);
    }
  }catch(e){}
  return res;
}

async function buildBank(files){
  const bank = new Set();
  for(const f of files){
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;
      for(const it of arr){
        if(Array.isArray(it.choices)) for(const c of it.choices) bank.add(c);
      }
    }catch(e){}
  }
  return Array.from(bank);
}

function tooSimilarToAny(candidate, list, thresh=0.5){
  for(const x of list) if(jaccard(candidate,x) > thresh) return true;
  // also check stem equality
  for(const x of list) if(simpleStem(candidate) === simpleStem(x)) return true;
  return false;
}

async function processFile(file, previewRoot, globalBank){
  const raw = await fs.readFile(file,'utf8');
  let arr;
  try{ arr = JSON.parse(raw); if(!Array.isArray(arr)) return null;}catch(e){return null;}
  let changed = 0;
  // collect choices used in this test to avoid reusing too often
  const used = new Set();
  for(const it of arr){ if(Array.isArray(it.choices)) for(const c of it.choices) used.add(normalize(c)); }

  for(const it of arr){
    if(!Array.isArray(it.choices) || it.choices.length<2) continue;
    // compute avg pairwise jaccard
    const choices = it.choices;
    let sum=0, count=0;
    for(let i=0;i<choices.length;i++){
      for(let j=i+1;j<choices.length;j++){ sum += jaccard(choices[i], choices[j]); count++; }
    }
    const avg = count? sum/count : 0;
    // detect high similarity (e.g., avg > 0.4 or many share stem)
    let stemSet = new Set(choices.map(c=>simpleStem(c)));
    const stemOverlapRatio = 1 - (stemSet.size / choices.length);
    if(avg > 0.4 || stemOverlapRatio > 0.4){
      // reconstruct choices keeping correct answer
      const correctIndex = (typeof it.answer === 'number') ? it.answer : 0;
      const correct = it.choices[correctIndex];
      const newChoices = [correct];
      const needed = it.choices.length - 1;
      // candidate pool: globalBank excluding ones too similar to correct or used
      const pool = globalBank.filter(c=> normalize(c) !== normalize(correct));
      // pick distractors
      for(const cand of pool){
        if(newChoices.length > it.choices.length - 1 + 1) break; // safety
        if(tooSimilarToAny(cand, newChoices, 0.45)) continue;
        if(used.has(normalize(cand))) continue; // avoid reuse in same test
        newChoices.push(cand);
        used.add(normalize(cand));
        if(newChoices.length === it.choices.length) break;
      }
      // if not enough found, fill with generic placeholders by altering words
      let altIndex = 0;
      while(newChoices.length < it.choices.length){
        const filler = correct + ' (' + ['A','B','C','D','E'][altIndex%5] + ')';
        if(!newChoices.includes(filler)) newChoices.push(filler);
        altIndex++;
      }
      // shuffle except keep correct at a random position, update answer index
      // place correct at random pos
      const correctPos = Math.floor(Math.random()*it.choices.length);
      const final = new Array(it.choices.length);
      let idx=0;
      for(let k=0;k<it.choices.length;k++){
        if(k===correctPos) final[k]=newChoices[0];
        else final[k]= newChoices[++idx];
      }
      const newAnswerIndex = correctPos;
      // apply
      if(JSON.stringify(final)!==JSON.stringify(it.choices) || newAnswerIndex !== correctIndex){
        it.choices = final;
        it.answer = newAnswerIndex;
        changed++;
      }
    }
  }

  if(changed>0){
    const rel = path.relative(path.join(__dirname,'..'), file);
    const outPath = path.join(previewRoot, rel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(arr, null, 2), 'utf8');
  }
  return {file, changed};
}

(async ()=>{
  const filesSet = new Set();
  for(const r of roots){ const f = await walk(r); f.forEach(x=>filesSet.add(x)); }
  const files = Array.from(filesSet);
  const globalBank = await buildBank(files);
  const previewRoot = path.join(__dirname, 'preview_diverse');
  await fs.rm(previewRoot, { recursive: true, force: true });
  const results = [];
  for(const f of files){ const r = await processFile(f, previewRoot, globalBank); if(r) results.push(r); }
  const changedFiles = results.filter(r=>r.changed>0);
  console.log(`Preview written to ${previewRoot}. Files processed: ${results.length}, files changed: ${changedFiles.length}`);
  for(const r of changedFiles.slice(0,20)) console.log(`${r.file}: ${r.changed}`);
})();
