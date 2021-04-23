const fs = require('fs-extra');
const path = require('path');
const promptly = require('promptly');

async function promptForStrictMode(projectPath) {
  const tsConfig = fs.readJsonSync(path.join(projectPath, 'tsconfig.json'));

  if (tsConfig.extends === './node_modules/@skyux-sdk/builder/tsconfig.strict') {
    return Promise.resolve(true);
  }

  return promptly.confirm(
    'Would you like to enable strict mode for your new SPA? ' +
    'Doing so will break everything, so only choose this option ' +
    'if you love to refactor.'
  );
}

module.exports = promptForStrictMode;
