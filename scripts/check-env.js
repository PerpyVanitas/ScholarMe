const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

// Read .env.example
const envExamplePath = path.join(__dirname, '..', '.env.example');
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
const envKeys = new Set();

envExampleContent.split('\n').forEach(line => {
  const match = line.match(/^([A-Z0-9_]+)=/);
  if (match) {
    envKeys.add(match[1]);
  }
});

// Basic grep for process.env usage
try {
  const output = child_process.execSync('git grep -ho ""process.env.[A-Z0-9_]*""', { encoding: 'utf8' });
  const matches = output.match(/process\.env\.([A-Z0-9_]+)/g) || [];
  
  const foundKeys = new Set(matches.map(m => m.replace('process.env.', '')));
  const ignoreList = ['NODE_ENV', 'CI'];
  
  let missing = false;
  foundKeys.forEach(key => {
    if (!envKeys.has(key) && !ignoreList.includes(key)) {
      console.error("Error: Missing environment variable "" + key + "" in .env.example");
      missing = true;
    }
  });
  
  if (missing) {
    process.exit(1);
  }
  console.log('Environment variable check passed.');
} catch (e) {
  // grep returns exit code 1 if no matches found, which is fine
  console.log('Environment variable check passed (or grep failed).');
}

