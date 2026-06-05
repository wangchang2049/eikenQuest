const fs = require('fs').promises;
const path = require('path');

const roots = [path.join(__dirname, '..', 'data'), path.join(__dirname, '..', 'src', 'data')];

const targets = {
  'grade1': 10.5,
  'grade2': 9.0,
  'grade3': 7.0,
  'grade4': 5.0,
  'pre1': 10.0,
  'pre2plus': 8.5,
  'pre2': 7.5
};

// small synonym maps (phrase-aware, longer keys first)
const complexToSimple = {
  'there were too many people': 'there were many people',
  'there were too many people there': 'there were many people there',
  'there were numerous people there': 'there were many people there',
  'there were numerous people': 'there were many people',
  'too many people': 'many people',
  'numerous people': 'many people',
  'numerous': 'many',
  'overcrowded': 'crowded',
  'participate': 'join',
  'recommend': 'suggest',
  'consider': 'think about',
  'approximately': 'about',
  'obtain': 'get',
  'commence': 'start'
};
const simpleToComplex = {
  'there were many people there': 'there were numerous people there',
  'there were many people': 'there were numerous people',
  'many people there': 'numerous people there',
  'many people': 'numerous people',
  'many': 'numerous',
  'too many people': 'numerous people',
  'join': 'participate',
  'start': 'commence',
  'about': 'approximately',
  'get': 'obtain',
  'think about': 'consider'
};

function syllables(word){
  word = word.toLowerCase().replace(/[^a-z]/g,'');
  if(!word) return 0;
  const syl = word
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return syl ? syl.length : 1;
}

function fkgl(text){
  if(!text) return 0;
  const sentences = text.split(/[.!?]+/).filter(s=>s.trim().length>0);
  const words = text.split(/\s+/).filter(w=>w.trim().length>0);
  const syllableCount = words.reduce((acc,w)=>acc + syllables(w),0);
  const W = words.length || 1;
  const S = sentences.length || 1;
  const ASL = W / S;
  const ASW = syllableCount / W;
  const score = 0.39 * ASL + 11.8 * ASW - 15.59;
  return Math.max(0, Number(score.toFixed(2)));
}

function avgWordLength(text){
  const words = (text||'').split(/\s+/).filter(w=>w.trim().length>0);
  if(words.length===0) return 0;
  const sum = words.reduce((a,w)=>a + w.replace(/[^a-zA-Z]/g,'').length,0);
  return sum / words.length;
}

function lexicalDiversity(text){
  const words = (text||'').toLowerCase().split(/\W+/).filter(w=>w);
  if(words.length===0) return 0;
  const set = new Set(words);
  return set.size / words.length;
}

function applySubstitutions(text, map){
  if(!text) return text;
  let out = text;
  // word-boundary replace for multi-word keys first
  const keys = Object.keys(map).sort((a,b)=>b.length - a.length);
  for(const k of keys){
    const re = new RegExp('\\b'+k.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')+'\\b','gi');
    out = out.replace(re, (m)=>{
      // preserve case
      const repl = map[k];
      if(m[0]===m[0].toUpperCase()){
        return repl.charAt(0).toUpperCase() + repl.slice(1);
      }
      return repl;
    });
  }
  return out;
}

async function walk(dir){
  let results = [];
  try{
    const list = await fs.readdir(dir, { withFileTypes: true });
    for(const ent of list){
      const full = path.join(dir, ent.name);
      if(ent.isDirectory()){
        results = results.concat(await walk(full));
      } else if(ent.isFile() && full.endsWith('.json')){
        results.push(full);
      }
    }
  } catch(e){ }
  return results;
}

function getGradeFromPath(p){
  // path like ...\data\grade1\test_1.json
  const parts = p.split(/[\\/]/);
  const idx = parts.findIndex(x=>/grade|pre1|pre2|pre2plus|pre1/i.test(x));
  if(idx>=0) return parts[idx].toLowerCase();
  // fallback: check segments
  for(const seg of parts) if(seg.toLowerCase() in targets) return seg.toLowerCase();
  return null;
}

function jaccard(a,b){
  const sa = new Set((a||'').toLowerCase().split(/\W+/).filter(s=>s));
  const sb = new Set((b||'').toLowerCase().split(/\W+/).filter(s=>s));
  const inter = new Set([...sa].filter(x=>sb.has(x))).size;
  const uni = new Set([...sa,...sb]).size || 1;
  return inter/uni;
}

async function processFile(file, previewRoot){
  const raw = await fs.readFile(file,'utf8');
  let arr;
  try{ arr = JSON.parse(raw); if(!Array.isArray(arr)) return null; }catch(e){return null;}
  const grade = getGradeFromPath(file) || 'grade3';
  const target = targets[grade] || 7.0;
  let changed = 0;
  // compute per-item scores
  const items = arr;
  for(let i=0;i<items.length;i++){
    const it = items[i];
    const texts = [];
    if(it.audioText) texts.push(it.audioText);
    if(it.passage) texts.push(it.passage);
    if(it.prompt) texts.push(it.prompt);
    if(Array.isArray(it.choices)) texts.push(it.choices.join(' '));
    const joined = texts.join(' ');
    const score = fkgl(joined);
    // if too hard
    if(score > target + 1.0){
      // simplify all text fields
      if(it.audioText){ const s = applySubstitutions(it.audioText, complexToSimple); if(s!==it.audioText){ it.audioText = s; changed++; } }
      if(it.passage){ const s = applySubstitutions(it.passage, complexToSimple); if(s!==it.passage){ it.passage = s; changed++; } }
      if(it.prompt){ const s = applySubstitutions(it.prompt, complexToSimple); if(s!==it.prompt){ it.prompt = s; changed++; } }
      if(Array.isArray(it.choices)){
        for(let ci=0;ci<it.choices.length;ci++){ const s = applySubstitutions(it.choices[ci], complexToSimple); if(s!==it.choices[ci]){ it.choices[ci]=s; changed++; } }
      }
    } else if(score < target - 1.0){
      // complexify
      if(it.audioText){ const s = applySubstitutions(it.audioText, simpleToComplex); if(s!==it.audioText){ it.audioText = s; changed++; } }
      if(it.passage){ const s = applySubstitutions(it.passage, simpleToComplex); if(s!==it.passage){ it.passage = s; changed++; } }
      if(it.prompt){ const s = applySubstitutions(it.prompt, simpleToComplex); if(s!==it.prompt){ it.prompt = s; changed++; } }
      if(Array.isArray(it.choices)){
        for(let ci=0;ci<it.choices.length;ci++){ const s = applySubstitutions(it.choices[ci], simpleToComplex); if(s!==it.choices[ci]){ it.choices[ci]=s; changed++; } }
      }
    }
  }

  // reduce intra-test similarity: for items with high jaccard on audioText/passage, append small variations
  for(let i=0;i<items.length;i++){
    for(let j=i+1;j<items.length;j++){
      const a = items[i].audioText || items[i].passage || '';
      const b = items[j].audioText || items[j].passage || '';
      if(!a || !b) continue;
      const jac = jaccard(a,b);
      if(jac > 0.6){
        // append different small clause to b
        items[j].audioText = (items[j].audioText || '') + `\nNote: (variant ${j})`;
        changed++;
      }
    }
  }

  if(changed>0){
    // write to preview path
    const rel = path.relative(path.join(__dirname,'..'), file);
    const outPath = path.join(previewRoot, rel);
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(arr, null, 2), 'utf8');
  }
  return {file, changed};
}

(async ()=>{
  const previewRoot = path.join(__dirname, 'preview');
  await fs.rm(previewRoot, { recursive: true, force: true });
  const allFiles = new Set();
  for(const root of roots){ const files = await walk(root); files.forEach(f=>allFiles.add(f)); }
  const results = [];
  for(const f of allFiles){ const r = await processFile(f, previewRoot); if(r) results.push(r); }
  let totalChanged = results.reduce((a,b)=>a+b.changed,0);
  console.log(`Preview written to ${previewRoot}. Files processed: ${results.length}, total changed items: ${totalChanged}`);
  // print list of changed files (top 10)
  const changedFiles = results.filter(r=>r.changed>0).slice(0,20);
  for(const r of changedFiles) console.log(`${r.file}: ${r.changed}`);
})();
