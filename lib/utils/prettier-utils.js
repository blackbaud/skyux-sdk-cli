const crossSpawn = require('cross-spawn');
const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const latestVersion = require('latest-version');
const path = require('path');

const jsonUtils = require('./json-utils');

/**
 * Adds Prettier configuration files to the project.
 */
 async function configurePrettier(projectPath) {
  await fs.ensureDir(path.join(projectPath, '.vscode'));

  await jsonUtils.writeJson(
    path.join(projectPath, '.vscode', 'settings.json'),
    {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.formatOnSave': true,
      'prettier.requireConfig': true
    }
  );

  await jsonUtils.writeJson(
    path.join(projectPath, '.prettierrc'),
    {
      singleQuote: true,
      trailingComma: 'none'
    }
  );
}

/**
 * Runs Prettier on source files.
 */
 function applyPrettierToFiles(projectPath) {
  logger.info('Applying Prettier to project...');

  crossSpawn.sync(
    'npx',
    [
      'prettier',
      '--write',
      '.'
    ],
    {
      stdio: 'inherit',
      cwd: projectPath
    }
  );

  logger.info('Done.');
}

async function addPrettierToDevDependencies(packageJson) {
  packageJson.devDependencies = packageJson.devDependencies || {};

  const packages = await Promise.all(
    [
      latestVersion('prettier'),
      latestVersion('eslint-config-prettier')
    ]
  );

  packageJson.devDependencies['prettier'] = packages[0];
  packageJson.devDependencies['eslint-config-prettier'] = packages[1];
}

module.exports = {
  addPrettierToDevDependencies,
  applyPrettierToFiles,
  configurePrettier
};
