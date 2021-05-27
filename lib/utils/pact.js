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
  ['@skyux-sdk/builder-plugin-pact', '@skyux-sdk/pact'].forEach(
    (packageName) => {
      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies[packageName] = '*';
    }
  );

  logger.info('Done.');

  return packageJson;
}

async function configExists() {
  let enablePact = false;

  // Check skyuxconfig.json file for Pact config.
  const skyuxConfigJson = await jsonUtils.readJson('skyuxconfig.json');
  enablePact = skyuxConfigJson.pacts !== undefined;

  // Check Pact-specific skyuxconfig.json file.
  if (!enablePact) {
    const fileExists = await fs.pathExists('skyuxconfig.pact.json');
    if (fileExists) {
      const skyuxPactConfigJson = await jsonUtils.readJson(
        'skyuxconfig.pact.json'
      );
      enablePact = skyuxPactConfigJson.pacts !== undefined;
    }
  }

  return enablePact;
}

async function validateConfig() {
  const hasPactConfig = await configExists();
  if (!hasPactConfig) {
    return;
  }

  // Make sure a skyuxconfig.pact.json file exists.
  const fileExists = await fs.pathExists('skyuxconfig.pact.json');
  if (!fileExists) {
    await jsonUtils.writeJson('skyuxconfig.pact.json', {});
  }

  const skyuxConfig = await jsonUtils.readJson('skyuxconfig.json');
  const skyuxPactConfig = await jsonUtils.readJson('skyuxconfig.pact.json');

  // Move `pacts` from skyuxconfig.json to skyuxconfig.pact.json.
  if (skyuxConfig.pacts) {
    skyuxPactConfig.pacts = skyuxConfig.pacts;
    delete skyuxConfig.pacts;
  }

  // Add Pact Builder plugin.
  skyuxPactConfig.plugins = skyuxPactConfig.plugins || [];
  /* istanbul ignore else */
  if (
    skyuxPactConfig.plugins.indexOf('@skyux-sdk/builder-plugin-pact') === -1
  ) {
    skyuxPactConfig.plugins.push('@skyux-sdk/builder-plugin-pact');
  }

  await jsonUtils.writeJson('skyuxconfig.json', skyuxConfig);
  await jsonUtils.writeJson('skyuxconfig.pact.json', skyuxPactConfig);
}

module.exports = {
  validateConfig,
  validateDependencies
};
