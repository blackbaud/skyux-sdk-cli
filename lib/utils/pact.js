const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const jsonUtils = require('./json-utils');

/**
 * Adds required Pact packages if project has appropriate configuration.
 * @param {*} packageJson The contents of a package.json file.
 */
async function validateDependencies(packageJson) {
  logger.info('Validating Pact dependencies...');

  const hasPactConfig = await configExists();

  // Pact config not provided; skip adding packages.
  if (!hasPactConfig) {
    logger.info('Skipped Pact setup since related configurations not found.');
    return packageJson;
  }

  // Add the names of the required packages for now; specific versions will be added in another step.
  [
    '@skyux-sdk/builder-plugin-pact',
    '@skyux-sdk/pact'
  ].forEach((packageName) => {
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies[packageName] = '*';
  });

  logger.info('Done.');

  return packageJson;
}

async function configExists() {
  let enablePact = false;

  // Check skyuxconfig.json file for Pact config.
  const skyuxConfigJson = await jsonUtils.readJson('skyuxconfig.json');
  enablePact = (skyuxConfigJson.pacts !== undefined);

  // Check Pact-specific skyuxconfig.json file.
  if (!enablePact) {
    const fileExists = await fs.pathExists('skyuxconfig.pact.json');
    if (fileExists) {
      const skyuxPactConfigJson = await jsonUtils.readJson('skyuxconfig.pact.json');
      enablePact = (skyuxPactConfigJson.pacts !== undefined);
    }
  }

  return enablePact;
}

module.exports = {
  configExists,
  validateDependencies
};
