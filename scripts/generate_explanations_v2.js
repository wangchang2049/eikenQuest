const fs = require('fs').promises;
const path = require('path');

async function walk(dir){
  let res=[];
  try{ const list = await fs.readdir(dir,{withFileTypes:true});
    for(const ent of list){ const full = path.join(dir, ent.name); if(ent.isDirectory()) res = res.concat(await walk(full)); else if(ent.isFile() && full.endsWith('.json')) res.push(full); }
  }catch(e){}
  return res;
}

function normalize(s){ return (s||'').replace(/[\n\r]/g,' ').replace(/\s+/g,' ').trim(); }
function tokens(s){ return normalize(s).toLowerCase().split(/\s+/).filter(Boolean); }
function jaccard(a,b){ const A=new Set(tokens(a)); const B=new Set(tokens(b)); const inter=[...A].filter(x=>B.has(x)).length; const uni=new Set([...A,...B]).size||1; return inter/uni; }

function detectTenseFromPrompt(prompt){
  const p = prompt.toLowerCase();
  if(/\bwould you|would they|would he|would she\b/.test(p)) return 'modal';
  if(/\bhow did you|did you|last|ago\b/.test(p)) return 'past';
  if(/\bare you|do you|does he|is it|are they|do people\b/.test(p)) return 'present';
  return null;
}

function makeExample(correct){
  if(/\b(went|visited|had|did|saw|bought|played|studied|learned)\b/i.test(correct)){
    return `例: They ${correct.replace(/\.$/,'')}.`;
  }
  if(/\b(I will|I'll|I am going to|we will|will)\b/i.test(correct)){
    return `例: I will ${correct.split(' ').slice(1).join(' ')}.`;
  }
  return `例: ${correct.replace(/\.$/,'')}.`;
}

function reasonForDistractor(correct, distractor, prompt){
  if(normalize(distractor)===normalize(correct)) return '表現はほぼ同じですが句読点や語順の差です。';
  if(jaccard(correct,distractor) > 0.6) return '意味は近いが語法や時制が正しくありません。';
  // tense mismatch
  const cPast = /\b(went|visited|had|did|was|were|saw|bought)\b/i.test(correct);
  const dPast = /\b(went|visited|had|did|was|were|saw|bought)\b/i.test(distractor);
  if(cPast && !dPast) return '設問が過去の文脈なので、過去形でないため不正解です。';
  if(!cPast && dPast) return '問いが現在の話題に関するため、過去形は文脈と合いません。';
  // modal/intent mismatch
  if(/\b(will|going to|might|would)\b/i.test(distractor) && !/\b(will|going to|might|would)\b/i.test(correct)) return '未来や意図を示す表現で、問いの意図と異なります。';
  if(/\b(not|no|never|none)\b/i.test(distractor) && !/\b(not|no|never|none)\b/i.test(correct)) return '否定の意味で文脈に合いません。';
  // short or fragment
  if(distractor.length < 5) return '語が短く、文として不自然です。';
  return '文脈にふさわしくない表現です。';
}

(async ()=>{
  const root = path.join(__dirname,'..','data');
  const files = await walk(root);
  let total=0, filesChanged=0;

  for(const f of files){
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;
      let changed=false;

      for(const item of arr){
        if(!item || !Array.isArray(item.choices)) continue;
        // Only replace generic explanations or short ones
        if(item.explanation && item.explanation.length > 30 && !/文脈に最も自然な表現です|文脈と合わない表現/.test(item.explanation)) continue;
        const correctIndex = (typeof item.answer === 'number')? item.answer : 0;
        const correct = item.choices[correctIndex];
        const prompt = item.prompt || '';
        const tense = detectTenseFromPrompt(prompt) || 'context';

        // Build explanation in Japanese
        let reason = '';
        if(tense === 'past'){
          reason = 'この問題は過去の出来事について述べている文脈なので、過去形が適切です。正解は過去形または過去の経験を表す表現だからです。';
        } else if(tense === 'present'){
          reason = 'この問題は現在の状態や習慣について尋ねているため、現在形や現在進行形が適切です。';
        } else if(tense === 'modal'){
          reason = '依頼・提案を表す文脈があるため、丁寧な助動詞や依頼表現がふさわしいです。';
        } else {
          reason = '文脈や語彙の使い方から、この表現が最も自然で適切です。';
        }

        const distractorNotes = item.choices.map((c,idx)=>{
          if(idx===correctIndex) return null;
          const note = reasonForDistractor(correct, c, prompt);
          return `「${c}」 — ${note}`;
        }).filter(Boolean).join('\n');

        const example = makeExample(correct);

        const expl = `${item.title || ''}\n正解: 「${correct}」\n理由: ${reason}\n他の選択肢の解説:\n${distractorNotes}\n例文: ${example}`;

        item.explanation = expl;
        changed = true; total++;
      }

      if(changed){
        await fs.writeFile(f, JSON.stringify(arr,null,2),'utf8');
        filesChanged++;
        console.log(`Improved explanations: ${path.relative(root,f)}`);
      }
    }catch(e){ console.error(`Error ${f}: ${e.message}`); }
  }

  console.log(`\nSummary: generated detailed explanations for ${total} items in ${filesChanged} files`);
})();
