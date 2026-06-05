const fs = require('fs').promises;
const path = require('path');

function unifiedDiff(aLines, bLines, nameA='A', nameB='B', context=3){
  const diffs = [];
  const max = Math.max(aLines.length, bLines.length);
  for(let i=0;i<max;i++){
    const a = aLines[i]||'';
    const b = bLines[i]||'';
    if(a!==b){
      diffs.push({i,a,b});
    }
  }
  if(diffs.length===0) return `${nameA} and ${nameB} are identical\n`;
  let out = `--- ${nameA}\n+++ ${nameB}\n`;
  for(const d of diffs){
    const start = Math.max(0, d.i - context);
    const end = Math.min(max-1, d.i + context);
    out += `@@ line ${start+1} - ${end+1} @@\n`;
    for(let j=start;j<=end;j++){
      const a = aLines[j]||'';
      const b = bLines[j]||'';
      if(a===b){ out += ' ' + a + '\n'; }
      else { out += '-' + a + '\n'; out += '+' + b + '\n'; }
    }
  }
  return out;
}

(async ()=>{
  const files = [
    'data\\grade1\\test_1.json',
    'data\\grade2\\test_1.json',
    'data\\grade3\\test_1.json',
    'data\\grade4\\test_1.json',
    'data\\pre2\\test_1.json'
  ];
  const previewRoot = path.join(__dirname,'preview');
  for(const rel of files){
    const orig = path.join(__dirname,'..',rel);
    const mod = path.join(previewRoot, rel);
    try{
      const a = (await fs.readFile(orig,'utf8')).split(/\r?\n/);
      const b = (await fs.readFile(mod,'utf8')).split(/\r?\n/);
      const diff = unifiedDiff(a,b, orig, mod, 2);
      console.log('=== DIFF for', rel, '===');
      console.log(diff.slice(0,2000));
      console.log('\n');
    } catch(e){
      console.log('Preview not found for', rel);
    }
  }
})();
