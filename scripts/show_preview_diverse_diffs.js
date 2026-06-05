const fs = require('fs').promises;
const path = require('path');

function unifiedDiff(aLines, bLines, nameA='A', nameB='B', context=2){
  const diffs = [];
  const max = Math.max(aLines.length, bLines.length);
  for(let i=0;i<max;i++){
    const a = aLines[i]||'';
    const b = bLines[i]||'';
    if(a!==b) diffs.push(i);
  }
  if(diffs.length===0) return `${nameA} and ${nameB} are identical\n`;
  let out = `--- ${nameA}\n+++ ${nameB}\n`;
  for(const i of diffs.slice(0,50)){
    const start = Math.max(0, i - context);
    const end = Math.min(max-1, i + context);
    out += `@@ line ${start+1} - ${end+1} @@\n`;
    for(let j=start;j<=end;j++){
      const a = aLines[j]||'';
      const b = bLines[j]||'';
      if(a===b) out += ' ' + a + '\n';
      else { out += '-' + a + '\n'; out += '+' + b + '\n'; }
    }
  }
  return out;
}

(async ()=>{
  const files = [
    'data\\grade4\\test_1.json',
    'data\\grade4\\test_2.json',
    'data\\grade4\\test_3.json',
    'data\\grade4\\test_4.json',
    'data\\grade4\\test_5.json'
  ];
  const previewRoot = path.join(__dirname,'preview_diverse');
  for(const rel of files){
    const orig = path.join(__dirname,'..',rel);
    const mod = path.join(previewRoot, rel);
    try{
      const a = (await fs.readFile(orig,'utf8')).split(/\r?\n/);
      const b = (await fs.readFile(mod,'utf8')).split(/\r?\n/);
      console.log('=== DIFF for', rel, '===');
      console.log(unifiedDiff(a,b, orig, mod, 2).slice(0,4000));
      console.log('\n');
    } catch(e){
      console.log('Preview not found for', rel);
    }
  }
})();
