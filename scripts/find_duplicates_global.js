const fs = require('fs').promises;
const path = require('path');

function normalize(s){return (s||'').toLowerCase().replace(/[\s\n\r]+/g,' ').replace(/[.,!?'"():;\[\]]/g,'').trim();}

async function walk(dir){ let res=[]; try{ const list=await fs.readdir(dir,{withFileTypes:true}); for(const ent of list){ const full=path.join(dir,ent.name); if(ent.isDirectory()) res=res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); }}catch(e){} return res; }

(async ()=>{
  const root = path.join(__dirname, '..', 'data');
  const files = await walk(root);
  const qMap = new Map();
  const cMap = new Map();
  for(const f of files){
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;
      for(let i=0;i<arr.length;i++){
        const it = arr[i];
        const qtxt = normalize([it.title, it.prompt, it.passage, it.audioText].join(' '));
        const qkey = qtxt;
        const loc = `${path.relative(path.join(__dirname,'..'), f)}#${i}`;
        if(!qMap.has(qkey)) qMap.set(qkey, []);
        qMap.get(qkey).push(loc);
        if(Array.isArray(it.choices)){
          const choicesNorm = it.choices.map(c=>normalize(c));
          // preserve order to detect reorder-only duplicates
          const choicesKey = choicesNorm.join(' ||| ');
          if(!cMap.has(choicesKey)) cMap.set(choicesKey, []);
          cMap.get(choicesKey).push(loc);
        }
      }
    }catch(e){ }
  }
  const dupQ = Array.from(qMap.entries()).filter(([k,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length);
  const dupC = Array.from(cMap.entries()).filter(([k,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length);
  const outLines = [];
  outLines.push(`Question text duplicates: ${dupQ.length}`);
  for(const [k,v] of dupQ.slice(0,50)){
    outLines.push(`--- occurrences: ${v.length}`);
    outLines.push(k);
    v.forEach(x=>outLines.push('  '+x));
  }
  outLines.push('\nChoice-array duplicates: '+dupC.length);
  for(const [k,v] of dupC.slice(0,50)){
    outLines.push(`--- occurrences: ${v.length}`);
    outLines.push(k);
    v.forEach(x=>outLines.push('  '+x));
  }
  const out = outLines.join('\n');
  await fs.writeFile(path.join(__dirname,'duplicate_report.txt'), out, 'utf8');
  console.log('Report written to scripts/duplicate_report.txt');
})();
