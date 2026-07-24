const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('coverage')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.md')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(process.cwd());
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace exact paths. Note: (?!v1\/) prevents replacing /api/v1/ again.
  content = content.replace(/\"\/api\/(?!v1\/)(.*?)\"/g, '\"/api/v1/$1\"');
  content = content.replace(/\`\/api\/(?!v1\/)(.*?)\`/g, '\`/api/v1/$1\`');
  content = content.replace(/\'\/api\/(?!v1\/)(.*?)\'/g, '\'/api/v1/$1\'');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});
console.log('Updated routes in ' + changedCount + ' files.');
