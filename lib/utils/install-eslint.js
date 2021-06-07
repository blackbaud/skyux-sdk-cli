const crossSpawn = require('cross-spawn');
const logger = require('@blackbaud/skyux-logger');
const path = require('path');

const jsonUtils = require('./json-utils');

/**
 * Installs the ESLint Angular builder.
 */
 async function installESLint(projectPath, libraryProjectPath) {
  logger.info(`Installing ESLint ...`);

  const result = crossSpawn.sync('ng', [
    'add',
    '@angular-eslint/schematics',
    '--skip-confirmation'
  ], {
    stdio: 'inherit',
    cwd: projectPath
  });

  // Angular's error messages do not bubble up to parent processes,
  // so we have to rely on the status code.
  if (result.status === 1) {
    throw new Error(`Failed to add ESLint to project.`);
  }

  logger.info('Updating ESLint configuration...');

  const eslintConfigPath = path.join(libraryProjectPath ?? projectPath, '.eslintrc.json');

  const eslintConfig = await jsonUtils.readJson(eslintConfigPath);

  eslintConfig.ignorePatterns = eslintConfig.ignorePatterns || [];
  eslintConfig.ignorePatterns.push('src/app/__skyux');

  if (eslintConfig.overrides) {
    for (const fileOverride of eslintConfig.overrides) {
      fileOverride.extends = fileOverride.extends || [];
      fileOverride.extends.push('prettier');
    }
  }

  await jsonUtils.writeJson(eslintConfigPath, eslintConfig);

  logger.info('ESLint configuration updated.');

  logger.info('Done.');
}

module.exports = installESLint;
