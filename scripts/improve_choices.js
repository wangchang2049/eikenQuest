const fs = require('fs').promises;
const path = require('path');

// Semantic variations for common answer patterns
const semanticVariations = {
  // Response patterns with similar meaning
  'I went there': ['I went to that place', 'I have been there', 'I visited that place', 'I did go there'],
  'I will go': ['I might go', 'I am going to go', 'I plan to go', 'I want to go'],
  "I didn't": ["I haven't", "I did not", "No, I didn't", "I wasn't"],
  'It was crowded': ['There were many people', 'It was packed', 'It was too crowded', 'Too many people were there'],
  'Yes, I do': ['I do', 'Yes, definitely', 'I do enjoy it', 'Yes, I like it'],
  'No, thanks': ['No, thank you', 'I prefer not to', 'No, I am okay', 'Not really'],
  "You're welcome": ['You are welcome', 'My pleasure', 'Happy to help', 'Anytime'],
  'I think so': ['I believe so', 'I suppose so', 'Probably yes', 'I guess so'],
  'I am not sure': ['I am uncertain', 'I do not know', 'Not sure about it', 'Uncertain'],
  "I don't know": ['I have no idea', 'I cannot tell', 'Not sure', 'I am unsure'],
  'Yes, it was': ['It was, yes', 'Yes, absolutely', 'Yes, indeed', 'That is right'],
  'No, it was not': ['It was not', 'No, it was not', 'Not at all', 'No, definitely not'],
  'I think it is great': ['It seems great to me', 'I believe it is great', 'It appears to be great', 'I think it is wonderful'],
  'I recommend it': ['I would suggest it', 'I suggest you try it', 'You should try it', 'It is worth trying'],
  'I would like to': ['I want to', 'I desire to', 'I wish to', 'I am interested in'],
  'It was fun': ['It was enjoyable', 'I had fun', 'It was entertaining', 'It was amusing'],
  'I agree': ['I concur', 'That is right', 'I think so too', 'I second that'],
  'I disagree': ['I do not agree', 'That is wrong', 'I think otherwise', 'I have a different opinion'],
  'Sorry': ['I apologize', 'My apologies', 'I am sorry', 'Excuse me'],
};

// Distractors that are semantically close but wrong
const closeDistractors = {
  // Common confusion points
  'I went there': [
    'I go there', // wrong tense
    'I am going there', // wrong tense
    'I want to go there', // different intention
    'I have gone there', // slightly different
  ],
  'I will go': [
    'I am going to go to', // not quite
    'I went', // wrong tense
    'I want to go', // not commitment
    'I shall go', // archaic
  ],
  'Yes, I do': [
    'Yes, I am', // wrong construction
    'I do it', // different meaning
    'I am doing it', // wrong tense
    'Yes, I will', // different meaning
  ],
  'No, thanks': [
    'Yes, thanks', // opposite
    'No, I will', // different meaning
    'Thanks anyway', // wrong sense
    'Yes, I will thanks', // wrong meaning
  ],
  "You're welcome": [
    'Thank you', // reversed
    'You are good', // wrong phrase
    'Welcome', // incomplete
    'I welcome you', // different meaning
  ],
  'It was crowded': [
    'It was not crowded', // opposite
    'It is crowded', // wrong tense
    'It was quiet', // opposite
    'It will be crowded', // wrong tense
  ],
};

// Generic distractors for fallback
const genericDistractors = [
  'Yes, of course',
  'Not really',
  'I am not sure',
  'Maybe later',
  'I do not know',
  'Definitely',
  'Probably not',
  'Sometimes',
  'Never',
  'Sure',
  'I think so',
  'I suppose so',
  'That sounds good',
  'I agree',
  'I disagree',
];

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[.,!?"'():;\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getVariations(answer) {
  const normalized = normalize(answer);
  
  // Check for close matches in semantic variations
  for (const [key, variations] of Object.entries(semanticVariations)) {
    if (normalized.includes(normalize(key)) || normalize(key).includes(normalized.split(' ')[0])) {
      return variations;
    }
  }
  
  // Check for close distractors
  for (const [key, distractors] of Object.entries(closeDistractors)) {
    if (normalized.includes(normalize(key)) || normalize(key).includes(normalized.split(' ')[0])) {
      return distractors;
    }
  }
  
  return null;
}

function generateDistractors(correct, count = 3) {
  const distractors = [];
  
  // Try semantic variations first
  const variations = getVariations(correct);
  if (variations && variations.length > 0) {
    for (let i = 0; i < count && i < variations.length; i++) {
      distractors.push(variations[i]);
    }
  }
  
  // Fill with generic distractors if needed
  if (distractors.length < count) {
    const needed = count - distractors.length;
    for (let i = 0; i < needed && i < genericDistractors.length; i++) {
      if (!distractors.includes(genericDistractors[i])) {
        distractors.push(genericDistractors[i]);
      }
    }
  }
  
  return distractors;
}

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

      for (const item of arr) {
        if (!Array.isArray(item.choices) || item.choices.length < 2) continue;
        
        const correctIndex = (typeof item.answer === 'number') ? item.answer : 0;
        const correctAnswer = item.choices[correctIndex];
        
        // Generate better distractors
        const distractors = generateDistractors(correctAnswer, item.choices.length - 1);
        
        if (distractors.length > 0) {
          // Reconstruct choices with correct answer and generated distractors
          const newChoices = [correctAnswer, ...distractors.slice(0, item.choices.length - 1)];
          
          // Shuffle and update answer index
          const correctPos = Math.floor(Math.random() * newChoices.length);
          const shuffled = new Array(newChoices.length);
          let idx = 0;
          for (let i = 0; i < newChoices.length; i++) {
            if (i === correctPos) shuffled[i] = newChoices[0];
            else shuffled[i] = newChoices[++idx];
          }
          
          if (JSON.stringify(shuffled) !== JSON.stringify(item.choices)) {
            item.choices = shuffled;
            item.answer = correctPos;
            changed = true;
            totalFixed++;
          }
        }
      }

      if (changed) {
        await fs.writeFile(f, JSON.stringify(arr, null, 2), 'utf8');
        filesChanged++;
        console.log(`Improved: ${path.relative(root, f)}`);
      }
    } catch(e) {
      console.error(`Error processing ${f}:`, e.message);
    }
  }

  console.log(`\nSummary: Improved ${totalFixed} questions in ${filesChanged} files`);
})();
