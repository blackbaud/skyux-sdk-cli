const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');

const cliVersion = require('./utils/cli-version');
const jsonUtils = require('./utils/json-utils');

const LOG_SEPARATOR = '------';

async function verifyLatestVersion() {

}

/**
 * Removes deprecated and unnecessary packages.
 * @param {Object} packageJson The contents of a package.json file.
 */
function removePackages(packageJson) {
  logger.info('Cleaning package dependencies...');

  const packageNames = [
    '@angular/http',
    '@pact-foundation/pact',
    '@pact-foundation/pact-web',
    '@skyux-sdk/builder-plugin-pact',
    '@skyux-sdk/pact',
    '@types/core-js',
    'core-js',
    'rxjs-compat'
  ];

  packageNames.forEach((packageName) => {
    delete packageJson.dependencies[packageName];
    delete packageJson.devDependencies[packageName];
    delete packageJson.peerDependencies[packageName];
  });

  logger.info(`Done.\n${LOG_SEPARATOR}`);

  return packageJson;
}

async function checkPactPackages(packageJson) {
  logger.info('Validating Pact dependencies...');

  let pactConfigExists = false;

  // Check skyuxconfig.json file for Pact config.
  const skyuxConfigJson = await jsonUtils.readJson('skyuxconfig.json');
  pactConfigExists = (skyuxConfigJson.pacts !== undefined);

  // Check Pact-specific skyuxconfig.json file.
  if (!pactConfigExists) {
    const fileExists = await fs.pathExists('skyuxconfig.pact.json');
    if (fileExists) {
      const skyuxPactConfigJson = await jsonUtils.readJson('skyuxconfig.pact.json');
      pactConfigExists = (skyuxPactConfigJson.pacts !== undefined);
    }
  }

  // Pact config not provided; skip adding packages.
  if (!pactConfigExists) {
    logger.info(`Skipped Pact setup since related configurations not found.\n${LOG_SEPARATOR}`);
    return packageJson;
  }

  // Add the names of the required packages for now; specific versions will be added in another step.
  [
    '@skyux-sdk/builder-plugin-pact',
    '@skyux-sdk/pact'
  ].forEach((packageName) => {
    packageJson.devDependencies[packageName] = '*';
  });

  logger.info(`Done.\n${LOG_SEPARATOR}`);

  return packageJson;

}

function upgradePackageVersions(packageJson) {
  return packageJson;
}

async function adjustPackageJson() {
  let packageJson = await jsonUtils.readJson('package.json');

  packageJson = removePackages(packageJson);
  packageJson = await checkPactPackages(packageJson);
  packageJson = upgradePackageVersions(packageJson);

  await jsonUtils.writeJson('package.json', packageJson);
}

async function migrate(argv) {

  logger.info(`${LOG_SEPARATOR}\nMigration started.\n${LOG_SEPARATOR}`);

  try {
    await cliVersion.verifyLatestVersion();
    await adjustPackageJson();
    logger.info('Migration completed successfully.');
  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
