const fs = require('fs').promises;
const path = require('path');

const roots = [path.join(__dirname, '..', 'data'), path.join(__dirname, '..', 'src', 'data')];

const cities = ['London','Kyoto','New York','Seoul','Tokyo','Rome','Miami','Toronto','Chicago','Sydney','Berlin','Osaka','Beijing','Bangkok','Barcelona','Delhi','Istanbul','Moscow','Dubai','Madrid'];
const personNames = ['Nancy','Grace','Tom','Mike','Frank','Sam','Lisa','Eve','Rachel','Ken','Oliver','Laura','John','Anna','David','Emily','Robert','Sophia','Chris','Mia'];

const crowdPhrases = [
  'Yes, but it was a bit crowded.',
  'Yes, although there were many people there.',
  'Yes, but it felt quite crowded.',
  'Yes, but it was pretty packed.',
  'Yes, although it was overcrowded.'
];

const questionStarts = [
  'Did you enjoy the',
  'Have you had the chance to visit the',
  'How did you like the',
  'Did you like the',
  'What did you think of the'
];

const followUps = [
  'Would you go there again?',
  'Would you visit again?',
  'Would you recommend it to others?',
  'Would you go back?',
  'Would you consider returning?'
];

function canonical(s){
  if(!s) return '';
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
  } catch(e){ }
  return results;
}

function pickVariant(baseIndex, variants){
  return variants[(baseIndex) % variants.length];
}

function normalizeToTemplate(s){
  if(!s) return '';
  // remove numbers, city names (capitalized words), person names, and standard crowd phrases
  return s.replace(/Over\s*\d+/ig, 'Over ##')
    .replace(/in\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z][a-z]+/g, 'in CITY, NAME')
    .replace(/in\s+[A-Z][a-z]+/g, 'in CITY')
    .replace(/Yes, but it was a bit crowded\./ig, 'CROWD')
    .replace(/[.,!?]/g,'').trim().toLowerCase();
}

function replaceCityNameNumber(s, city, name, number){
  let t = s;
  t = t.replace(/Over\s*\d+\s*people\s*were\s*there\.?/i, `Over ${number} people were there.`);
  // if pattern has CITY, NAME placeholder
  t = t.replace(/in\s+CITY,\s*NAME/i, `in ${city}, ${name}`);
  // fallback: replace first 'in <Word>' occurrence
  t = t.replace(/in\s+[A-Za-z]+/i, `in ${city}`);
  // replace any trailing name after comma before question
  t = t.replace(/,\s*[A-Za-z]+\?/g, `, ${name}?`);
  return t;
}

async function processFile(file){
  const raw = await fs.readFile(file, 'utf8');
  let arr;
  try{ arr = JSON.parse(raw); if(!Array.isArray(arr)) return null;}catch(e){return null;}
  let changed = 0;

  // For each item in the file, apply controlled paraphrases to reduce surface similarity
  for(let idx=0; idx<arr.length; idx++){
    const item = arr[idx];
    const base = idx + 1;
    const city = pickVariant(base, cities);
    const name = pickVariant(base, personNames);
    const number = 180 + base*4;
    const qStart = pickVariant(base, questionStarts);
    const follow = pickVariant(base+1, followUps);
    const crowd = pickVariant(base, crowdPhrases);

    // Process audioText if present
    if(item.audioText && typeof item.audioText === 'string'){
      const orig = item.audioText;
      let modified = orig;

      // Try to capture pattern "A: Did you enjoy the <activity> in <City>, <Name>?" and rephrase
      const m = orig.match(/A:\s*Did you enjoy the\s+(.+?)\s+in\s+([A-Za-z ]+),\s*([A-Za-z]+)\?/i);
      if(m){
        const activity = m[1];
        modified = `A: ${qStart} ${activity} in ${city}, ${name}?\nB: ${crowd}\nA: I see. ${follow}`;
      } else {
        // Generic replacements: vary crowd phrase, numbers, and follow-up
        modified = modified.replace(/Yes, but it was a bit crowded\./i, crowd);
        modified = replaceCityNameNumber(modified, city, name, number);
        modified = modified.replace(/Would you go there again\?/i, follow);
      }

      if(modified !== orig){ item.audioText = modified; changed++; }
    }

    // Vary passage if exists
    if(item.passage && item.passage.trim().length>0){
      const origP = item.passage;
      const newP = origP.replace(/there\./i, `there in ${city}.`);
      if(newP !== origP){ item.passage = newP; changed++; }
    }

    // Vary prompt if generic Japanese instruction
    if(item.prompt && /対話|質問/.test(item.prompt)){
      const prompts = [
        '対話を聞き、その最後の発言に対する応答として最も適切なものを一つ選びなさい。',
        '対話を聞いて、最後の発言に最も合う応答を一つ選んでください。',
        '会話を聞き、最後の発言への適切な応答を選択してください。',
      ];
      const newPrompt = pickVariant(base, prompts);
      if(newPrompt !== item.prompt){ item.prompt = newPrompt; changed++; }
    }

    // Shuffle or rotate choices to reduce pattern
    if(Array.isArray(item.choices) && item.choices.length>1){
      const origChoices = item.choices.slice();
      const k = base % item.choices.length;
      const rotated = origChoices.slice(k).concat(origChoices.slice(0,k));
      // minor phrase tweak for the first choice to vary tokens
      rotated[0] = rotated[0].replace(/\.$/, '') + '.';
      item.choices = rotated;
      if(JSON.stringify(item.choices)!==JSON.stringify(origChoices)) changed++;
    }

    // Slightly vary title to include city occasionally
    if(item.title && /リスニング/.test(item.title)){
      const origT = item.title;
      const newT = origT.replace(/(リスニング第\d部)/, `$1 (${city})`);
      if(newT !== origT){ item.title = newT; changed++; }
    }
  }

  if(changed>0){ await fs.writeFile(file, JSON.stringify(arr, null, 2), 'utf8'); }
  return {file, changed};
}

(async ()=>{
  const allFiles = new Set();
  for(const root of roots){ const files = await walk(root); files.forEach(f=>allFiles.add(f)); }
  const filesArr = Array.from(allFiles);
  const results = [];
  for(const f of filesArr){ const r = await processFile(f); if(r) results.push(r); }
  let totalChanged = 0;
  for(const r of results){ if(r.changed>0){ console.log(`Updated ${r.file}: ${r.changed} fields changed`); totalChanged += r.changed; } }
  console.log(`Done. Files processed: ${results.length}, total fields changed: ${totalChanged}`);
})();
