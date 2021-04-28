const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

async function promptForStrictMode(projectPath) {
  const tsConfig = fs.readJsonSync(path.join(projectPath, 'tsconfig.json'));

  if (tsConfig.extends === './node_modules/@skyux-sdk/builder/tsconfig.strict') {
    return Promise.resolve(true);
  }

  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmation',
      message: 'Would you like to enable strict mode for your new Angular project? ' +
      'Doing so will break everything, so only choose this option ' +
      'if you love to refactor.',
      default: false
    }
  ])
}

module.exports = promptForStrictMode;
