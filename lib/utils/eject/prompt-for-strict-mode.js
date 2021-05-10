const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

async function promptForStrictMode(projectPath) {
  const tsConfig = fs.readJsonSync(path.join(projectPath, 'tsconfig.json'));

  if (tsConfig.extends === './node_modules/@skyux-sdk/builder/tsconfig.strict') {
    return Promise.resolve(true);
  }

  const promptName = 'strict-confirmation';

  const result = await inquirer.prompt([
    {
      type: 'confirm',
      name: promptName,
      message: 'Would you like to enable strict mode for your new Angular project? ' +
        'Doing so will break everything, so only choose this option ' +
        'if you love to refactor.',
      default: false
    }
  ]);

  return result[promptName];
}

module.exports = promptForStrictMode;
