const fs = require('fs').promises;
const path = require('path');

const TOPIC_POOL = [
  'environmental issues', 'sports events', 'school library programs', 'local festivals', 'online lessons',
  'smartphone apps', 'volunteer activities', 'school club activities', 'community events', 'museum exhibitions',
  'job opportunities', 'science fairs', 'music concerts', 'art workshops', 'language classes', 'career counseling',
  'study abroad programs', 'exchange programs', 'food festivals', 'farmers markets', 'transportation services',
  'health campaigns', 'recycling programs', 'coding classes', 'robotics clubs', 'drama performances'
];

async function walk(dir) {
  let res = [];
  try {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const ent of list) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) res = res.concat(await walk(full));
      else if (ent.isFile() && full.endsWith('.json')) res.push(full);
    }
  } catch(e) {}
  return res;
}

function pickTopics(n, used) {
  const pool = TOPIC_POOL.filter(t => !used.has(t));
  const out = [];
  for (let i = 0; i < n; i++) {
    if (pool.length === 0) {
      // fallback: generate synthetic topic
      out.push(`topic_${Date.now()%10000}_${i}`);
    } else {
      const idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx,1)[0]);
    }
  }
  return out;
}

(async ()=>{
  const root = path.join(__dirname, '..', 'data');
  const files = await walk(root);
  let changedFiles = 0;
  let totalChanged = 0;

  const promptRegex = /Over\s*(\d+)\s+students\s+in\s+([A-Za-z\s]+?)\s+are interested in\s*\(\s*\)\s*(.+?)\./i;

  for (const f of files) {
    try{
      const raw = await fs.readFile(f,'utf8');
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) continue;

      // Collect indices with matching prompts
      const matches = [];
      for (let i=0;i<arr.length;i++){
        const item = arr[i];
        if(item && typeof item.prompt === 'string'){
          const m = item.prompt.match(promptRegex);
          if(m) matches.push({index:i, match:m, item});
        }
      }

      if(matches.length <= 1) continue; // nothing to diversify

      // choose new topics different per matched item
      const usedTopics = new Set();
      const newTopics = pickTopics(matches.length, usedTopics);

      for (let j=0;j<matches.length;j++){
        const m = matches[j];
        const orig = m.item.prompt;
        // replace the fragment after the placeholder parentheses with new topic
        // original prompt has pattern ending with something like " (      ) smartphone apps."
        // We'll find the part after the parentheses and replace with chosen topic
        const newTopic = newTopics[j];
        const newPrompt = orig.replace(/\(\s*\)\s*.+?\./, `(      ) ${newTopic}.`);
        if(newPrompt !== orig){
          m.item.prompt = newPrompt;
          totalChanged++;
        }
      }

      // write back
      await fs.writeFile(f, JSON.stringify(arr, null, 2), 'utf8');
      changedFiles++;
      console.log(`Diversified: ${path.relative(root, f)} (${matches.length} prompts)`);
    }catch(e){ console.error(`Error ${f}: ${e.message}`); }
  }

  console.log(`\nSummary: diversified ${totalChanged} prompts in ${changedFiles} files`);
})();
