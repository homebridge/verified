const fs = require('fs');

const verified = JSON.parse(fs.readFileSync('verified-plugins.json', 'utf8'));
const verifiedSorted = verified.sort();
fs.writeFileSync('verified-plugins.json', JSON.stringify(verifiedSorted, null, 2) + '\n');

const verifiedPlus = JSON.parse(fs.readFileSync('verified-plus-plugins.json', 'utf8'));
const verifiedPlusSorted = verifiedPlus.sort();
fs.writeFileSync('verified-plus-plugins.json', JSON.stringify(verifiedPlusSorted, null, 2) + '\n');

const hidden = JSON.parse(fs.readFileSync('hidden-plugins.json', 'utf8'));
const hiddenSorted = hidden.sort();
fs.writeFileSync('hidden-plugins.json', JSON.stringify(hiddenSorted, null, 2) + '\n');

for (const plugin of verifiedPlusSorted) {
  console.log(`| verified plus | [${plugin}](https://www.npmjs.com/package/${plugin}) |`);
}

for (const plugin of verifiedSorted) {
  console.log(`| verified | [${plugin}](https://www.npmjs.com/package/${plugin}) |`);
}

for (const plugin of hiddenSorted) {
  console.log(`| hidden | [${plugin}](https://www.npmjs.com/package/${plugin}) |`);
}

const icons = JSON.parse(fs.readFileSync('plugin-icons.json', 'utf8'));

fs.writeFileSync('plugin-icons.json', JSON.stringify(Object.keys(icons)
  .filter((key) => {
    const iconFile = icons[key];
    if (verified.indexOf(key) === -1) {
      console.log(` - Ignoring icon for ${key} because it is not in the verified list`);
      return false;
    }
    if (!fs.existsSync(`./${iconFile}`)) {
      console.log(` - Ignoring icon for ${key} because the icon file does not exist`);
      return false;
    }
    return true;
  })
  .sort()
  .reduce((obj, key) => {
    obj[key] = icons[key];
    return obj;
  }, {}), null, 2) + '\n');
