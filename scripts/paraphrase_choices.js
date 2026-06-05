const fs = require('fs').promises;
const path = require('path');

const roots = [
  path.join(__dirname, '..', 'data'),
  path.join(__dirname, '..', 'src', 'data'),
];

const mapping = {
  'probably yes': [
    'Probably yes.',
    'I think so.',
    'Yes, probably.',
    'That seems likely.',
    'I suppose so.'
  ],
  "no, i didn't": [
    "No, I didn't.",
    "I didn't.",
    "No, I wasn't.",
    "No — I didn't go.",
    "I did not."
  ],
  'it was crowded': [
    'It was crowded.',
    'There were too many people.',
    'It felt crowded.',
    'It was packed.',
    'It was pretty crowded.'
  ],
  'i went there': [
    'I went there.',
    'I have been there.',
    'Yes, I went.',
    'I visited.',
    'I did go there.'
  ],
  'go to the activity': [
    'Go to the activity.',
    'Attend the activity.',
    'Go to the event.',
    'Head to the activity.'
  ],
  'ask the woman': [
    'Ask the woman.',
    'Ask her.',
    'Question the woman.',
    'Ask the person.'
  ],
  'sign up for the activity': [
    'Sign up for the activity.',
    'Register for it.',
    'Enroll in the activity.',
    'Sign up today.'
  ],
  'wait until monday': [
    'Wait until Monday.',
    'Wait until then.',
    'Hold off until Monday.',
    'Wait until next Monday.'
  ]
};

function canonical(s){
  return s.replace(/[\u2018\u2019\u201c\u201d]/g,'')
    .replace(/[.,!?]/g,'')
    .trim()
    .toLowerCase();
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
  } catch(e){
    // ignore
  }
  return results;
}

async function processFile(file){
  const raw = await fs.readFile(file, 'utf8');
  let arr;
  try{
    arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return null;
  } catch(e){
    return null;
  }
  let changed = 0;
  // For each test file (represents a mock test), ensure choices variants are unique across items
  // Build usedVariant map per canonical key
  const usedVariants = {};

  for(const item of arr){
    if(!Array.isArray(item.choices)) continue;
    for(let i=0;i<item.choices.length;i++){
      const orig = item.choices[i];
      const key = canonical(orig);
      if(mapping[key]){
        if(!usedVariants[key]) usedVariants[key]=new Set();
        // find first variant not used
        const variants = mapping[key];
        let chosen = null;
        for(const v of variants){
          if(!usedVariants[key].has(v)){
            chosen = v; break;
          }
        }
        if(!chosen){
          // rotate by index to keep deterministic
          const idx = (Array.from(usedVariants[key]).length) % variants.length;
          chosen = variants[idx];
        }
        if(chosen !== orig){
          item.choices[i] = chosen;
          changed++;
        }
        usedVariants[key].add(chosen);
      } else {
        // no mapping; no change
      }
    }
  }

  if(changed>0){
    // write back formatted
    await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8');
  }
  return {file, changed};
}

(async ()=>{
  const allFiles = new Set();
  for(const root of roots){
    const files = await walk(root);
    files.forEach(f=>allFiles.add(f));
  }
  const filesArr = Array.from(allFiles);
  const results = [];
  for(const f of filesArr){
    const r = await processFile(f);
    if(r) results.push(r);
  }
  let totalChanged = 0;
  for(const r of results){
    if(r.changed>0){
      console.log(`Updated ${r.file}: ${r.changed} choices changed`);
      totalChanged += r.changed;
    }
  }
  console.log(`Done. Files processed: ${results.length}, total choices changed: ${totalChanged}`);
})();
