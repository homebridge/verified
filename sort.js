const fs = require('fs');

const verified = JSON.parse(fs.readFileSync('verified-plugins.json', 'utf8'));
fs.writeFileSync('verified-plugins.json', JSON.stringify(verified.sort(), null, 2) + '\n');

const icons = JSON.parse(fs.readFileSync('plugin-icons.json', 'utf8'));
const sorted = Object.keys(icons).sort().reduce((obj, key) => {
  obj[key] = icons[key];
  return obj;
}, {});
fs.writeFileSync('plugin-icons.json', JSON.stringify(sorted, null, 2) + '\n');

for (const plugin of verified.sort()) {
  console.log(`| [${plugin}](https://www.npmjs.com/package/${plugin}) |`)
}
