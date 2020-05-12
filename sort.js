const fs = require('fs');

const verified = JSON.parse(fs.readFileSync('verified-plugins.json', 'utf8'));
fs.writeFileSync('verified-plugins.json', JSON.stringify(verified.sort(), null, 2));

for (const plugin of verified.sort()) {
  console.log(`| [${plugin}](https://www.npmjs.com/package/${plugin}) |`)
}