const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const latestVersion = require('latest-version');

const cliVersion = require('./utils/cli-version');
const jsonUtils = require('./utils/json-utils');
const stylesheets = require('./utils/stylesheets');

const LOG_SEPARATOR = '------';

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

/**
 * Sets the appropriate version ranges for dependencies, devDependencies, and peerDependencies.
 * @param {Object} packageJson The contents of a package.json file.
 */
async function upgradePackageVersions(packageJson) {
  const latestAngularVersion = await latestVersion('@angular/core');

  const packageConfigs = [
    {
      regexp: /^@angular\//,
      version: `^${latestAngularVersion}`
    },
    {
      regexp: /^@blackbaud\/skyux-lib-stache$/,
      version: '^4.0.0-rc.0'
    },
    {
      regexp: /^@blackbaud\/skyux-lib-(clipboard|code-block|media)$/,
      version: '^2.0.0-rc.0'
    },
    {
      regexp: /^@skyux\//,
      version: '^4.0.0-rc.0'
    },
    {
      regexp: /^@skyux-sdk\/(builder|e2e|pact|testing)$/,
      version: '^4.0.0-rc.0'
    },
    {
      regexp: /^@skyux-sdk\/builder-plugin-pact$/,
      version: '^4.0.0-rc.0'
    }
  ];

  packageConfigs.forEach((packageConfig) => {
    [
      'dependencies',
      'devDependencies',
      'peerDependencies'
    ].forEach((section) => {
      if (!packageJson[section]) {
        return;
      }

      Object.keys(packageJson[section]).forEach(packageName => {
        if (packageConfig.regexp.test(packageName)) {
          packageJson[section][packageName] = packageConfig.version;
        }
      });
    });
  });

  return packageJson;
}

async function adjustPackageJson() {
  let packageJson = await jsonUtils.readJson('package.json');

  packageJson = removePackages(packageJson);
  packageJson = await checkPactPackages(packageJson);
  packageJson = await upgradePackageVersions(packageJson);

  await jsonUtils.writeJson('package.json', packageJson);
}

async function adjustSkyUxConfigJson() {
  logger.info('Cleaning skyuxconfig.json...');

  let skyuxJson = await jsonUtils.readJson('skyuxconfig.json');

  if (skyuxJson.omnibar) {
    delete skyuxJson.omnibar.experimental;
  }

  await jsonUtils.writeJson('skyuxconfig.json', skyuxJson);

  logger.info(`Done.\n${LOG_SEPARATOR}`);
}

async function migrate() {

  logger.info(`${LOG_SEPARATOR}\nMigration started.\n${LOG_SEPARATOR}`);

  try {

    await cliVersion.verifyLatestVersion();

    await adjustPackageJson();

    await adjustSkyUxConfigJson();

    await stylesheets.fixSassDeep();

    logger.info('Migration completed successfully.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
