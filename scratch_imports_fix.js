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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
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

  // Replace import paths like "@/app/api/v1/..." and "../../../app/api/v1/..."
  // Match any quote, then anything ending with app/api/ (but not app/api/v1/)
  content = content.replace(/([\"\'\`])(.*?)app\/api\/(?!v1\/)(.*?)\1/g, '$1$2app/api/v1/$3$1');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});
console.log('Fixed imports in ' + changedCount + ' files.');
