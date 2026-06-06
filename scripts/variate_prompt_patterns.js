const fs = require('fs').promises;
const path = require('path');

const replacements = [
  { // Can you -> various modal/ability forms
    pattern: /\bCan you\b/ig,
    choices: ['Could you', 'Would you be able to', 'Are you able to', 'Do you know how to', 'Would you mind']
  },
  { // Do you -> Are you / Have you
    pattern: /\bDo you\b/ig,
    choices: ['Are you', 'Have you ever', 'Would you', 'Do people', 'Do they']
  },
  { // Have you -> variations
    pattern: /\bHave you\b/ig,
    choices: ['Have you ever', 'Did you ever', 'Do you ever', 'Were you able to', 'Is it true that you']
  },
  { // I will -> I might / I plan
    pattern: /\bI will\b/ig,
    choices: ['I might', 'I plan to', "I'm going to", 'I intend to', 'I may']
  },
  { // Over N students in X are interested in ( ) Y.
    pattern: /Over\s+(\d+)\s+students\s+in\s+([A-Za-z\s]+?)\s+are interested in\s*\(\s*\)\s*([^\.]+)\./ig,
    repl: (m, p1, p2, p3) => {
      const templates = [
        `A survey found that over ${p1} students in ${p2} were interested in (      ) ${p3}.`,
        `More than ${p1} students in ${p2} showed interest in (      ) ${p3}.`,
        `In ${p2}, over ${p1} students expressed interest in (      ) ${p3}.`,
        `Over ${p1} students from ${p2} said they were interested in (      ) ${p3}.`,
        `A study reported that more than ${p1} students in ${p2} liked (      ) ${p3}.`
      ];
      return templates[Math.floor(Math.random()*templates.length)];
    }
  },
  { // How did you like -> variations
    pattern: /\bHow did you like\b/ig,
    choices: ['What did you think of', 'How was', 'Did you enjoy', 'What was your impression of']
  },
  { // Would you recommend -> variations
    pattern: /\bWould you recommend\b/ig,
    choices: ['Would you suggest', 'Would you advise', 'Do you recommend', 'Would you tell others to try']
  },
  { // generic: It was (crowded) -> change phrasing
    pattern: /\bIt felt quite crowded\b/ig,
    choices: ['It was very crowded', 'It felt packed', 'There were too many people', 'It seemed overcrowded']
  }
];

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

function applyReplacementsToPrompt(prompt){
  let changed = false;
  let out = prompt;
  for(const r of replacements){
    if(r.repl){
      const newOut = out.replace(r.pattern, r.repl);
      if(newOut !== out){ out = newOut; changed = true; }
    } else if(r.choices){
      // replace first occurrence only to increase variety
      out = out.replace(r.pattern, (match)=>{
        const choice = r.choices[Math.floor(Math.random()*r.choices.length)];
        changed = true;
        return choice;
      });
    }
  }
  return { out, changed };
}

(async ()=>{
  const root = path.join(__dirname,'..','data');
  const files = await walk(root);
  let total = 0, filesChanged = 0;
  for(const f of files){
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;
      let changedFile = false;
      for(const item of arr){
        if(!item || typeof item.prompt !== 'string') continue;
        // Process only the English question part: usually after a blank line
        const parts = item.prompt.split('\n');
        const englishIndex = parts.findIndex(p => /[A-Za-z]{3,}/.test(p));
        if(englishIndex === -1) continue;
        const eng = parts[englishIndex];
        const res = applyReplacementsToPrompt(eng);
        if(res.changed){
          parts[englishIndex] = res.out;
          item.prompt = parts.join('\n');
          changedFile = true;
          total++;
        }
      }
      if(changedFile){
        await fs.writeFile(f, JSON.stringify(arr, null, 2), 'utf8');
        filesChanged++;
        console.log(`Varied: ${path.relative(root,f)}`);
      }
    }catch(e){ console.error(`Error ${f}: ${e.message}`); }
  }
  console.log(`\nSummary: varied ${total} prompts in ${filesChanged} files`);
})();
