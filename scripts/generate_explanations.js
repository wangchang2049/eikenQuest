const fs = require('fs').promises;
const path = require('path');

function normalize(s){return (s||'').toLowerCase().replace(/[.,!?"'():;\[\]]/g,'').replace(/\s+/g,' ').trim();}
function tokens(s){return normalize(s).split(/\s+/).filter(Boolean);} 
function jaccard(a,b){const A=new Set(tokens(a)); const B=new Set(tokens(b)); const inter=[...A].filter(x=>B.has(x)).length; const uni=new Set([...A,...B]).size||1; return inter/uni;}

async function walk(dir){
  let res=[]; try{ const list=await fs.readdir(dir,{withFileTypes:true}); for(const ent of list){ const full=path.join(dir,ent.name); if(ent.isDirectory()) res=res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); } }catch(e){} return res; }

function detectPast(s){ return /\b(went|visited|had|did|played|saw|ate|was|were|were|bought|sang)\b/i.test(s); }
function detectPresentContinuous(s){ return /\b(is|are|am|doing|going|playing|studying)\b/i.test(s); }

(async ()=>{
  const root = path.join(__dirname,'..','data');
  const files = await walk(root);
  let total=0, filesChanged=0;
  const genericRe = /文脈と設問条件に最も合う選択肢/;

  for(const f of files){
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;
      let changed=false;
      for(const item of arr){
        try{
          if(!item || !Array.isArray(item.choices)) continue;
          if(!item.explanation || genericRe.test(item.explanation)){
            const correctIndex = (typeof item.answer==='number')? item.answer : 0;
            const correct = item.choices[correctIndex];
            const others = item.choices.filter((c,i)=>i!==correctIndex);
            // Build reasons
            const reasons = others.map(o=>{
              if(normalize(o)===normalize(correct)) return '表現の差だけで意味はほぼ同じ';
              if(jaccard(o,correct) > 0.5) return '意味は近いが語法や時制が異なる';
              return '文脈と合わない表現';
            });
            let lead = '';
            if(detectPast(correct)) lead = '設問が過去の出来事を尋ねているため、過去形が適切です。';
            else if(detectPresentContinuous(correct)) lead = '進行形や現在の状態を表す表現が適切です。';
            else lead = '文脈に最も自然な表現です。';
            const otherNotes = others.map((o,i)=>`「${o}」: ${reasons[i]}`).join('； ');
            const expl = `${item.title || ''} 正解は「${correct}」。${lead} 他の選択肢は次の通りです：${otherNotes}。`;
            item.explanation = expl;
            changed = true; total++;
          }
        }catch(e){ /* skip item errors */ }
      }
      if(changed){
        await fs.writeFile(f, JSON.stringify(arr,null,2),'utf8');
        filesChanged++;
        console.log(`Generated explanations: ${path.relative(root,f)}`);
      }
    }catch(e){ console.error(`Error ${f}: ${e.message}`); }
  }
  console.log(`\nSummary: generated ${total} explanations in ${filesChanged} files`);
})();
