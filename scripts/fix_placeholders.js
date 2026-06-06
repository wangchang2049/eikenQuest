const fs = require('fs').promises;
const path = require('path');

const fallback = [
  'a museum','a concert','a picnic','a trip','a lecture','a workshop','a party','a movie','a coffee shop','a restaurant',
  'a bookstore','a library','a zoo','a park','a festival','a swimming pool','a train station','a bus stop','a bakery','a gym',
  'a hospital','a school','a hotel','a store','a market','a beach','a mountain','a river','a lake','not really',
  'yes, of course','no, I haven\'t','I\'m not sure','maybe later','I don\'t know','definitely','probably not','sometimes','never','sure',
  'OK','alright','I see','got it','understood','really?','seriously?','for sure','absolutely','certainly','not at all','no way','of course not',
  'I don\'t think so','yesterday','tomorrow','last week','next week','this week','this weekend','on Monday','on Tuesday','on Wednesday',
  'on Thursday','on Friday','on Saturday','on Sunday','in the morning','in the afternoon','in the evening','at night','early','late',
  'soon','later','eventually','thank you','thanks a lot','thank you so much','you\'re welcome','no problem','happy to help','sorry',
  'excuse me','pardon me','I apologize','that\'s right','that\'s wrong','I agree','I disagree','I don\'t agree','sounds good','looks good',
  'smells good','tastes good','feels good','I like it','I don\'t like it','I love it','I hate it','I enjoy it','I prefer it','I\'m interested',
  'I\'m not interested','I\'m tired','I\'m hungry','I\'m thirsty','I\'m cold','I\'m warm','I\'m busy','I\'m free'
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

(async () => {
  const root = path.join(__dirname, '..', 'data');
  const files = await walk(root);
  let totalFixed = 0;
  let filesChanged = 0;

  for (const f of files) {
    try {
      const raw = await fs.readFile(f, 'utf8');
      let arr = JSON.parse(raw);
      if (!Array.isArray(arr)) continue;

      let changed = false;
      let fallbackIndex = 0;

      for (const item of arr) {
        if (!Array.isArray(item.choices)) continue;
        
        for (let i = 0; i < item.choices.length; i++) {
          const choice = item.choices[i];
          // Check if it's a placeholder
          if (typeof choice === 'string' && choice.startsWith('option_')) {
            // Replace with fallback
            item.choices[i] = fallback[fallbackIndex % fallback.length];
            fallbackIndex++;
            changed = true;
            totalFixed++;
          }
        }
      }

      if (changed) {
        await fs.writeFile(f, JSON.stringify(arr, null, 2), 'utf8');
        filesChanged++;
        console.log(`Fixed: ${path.relative(root, f)}`);
      }
    } catch(e) {
      console.error(`Error processing ${f}:`, e.message);
    }
  }

  console.log(`\nSummary: Fixed ${totalFixed} placeholders in ${filesChanged} files`);
})();
