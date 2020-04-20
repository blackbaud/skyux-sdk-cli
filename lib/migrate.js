const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const latestVersion = require('latest-version');

const cliVersion = require('./utils/cli-version');
const icons = require('./utils/icons');
const jsonUtils = require('./utils/json-utils');
const stylesheets = require('./utils/stylesheets');

const cleanup = require('./cleanup');
const upgrade = require('./upgrade');

const LOG_SEPARATOR = '------';

/**
 * Removes deprecated and unnecessary packages.
 * @param {Object} packageJson The contents of a package.json file.
 */
function removePackages(packageJson) {
  logger.info('Cleaning package dependencies...');

  const packages = [
    {
      name: /^@angular\/http$/,
      reason: 'Angular no longer supports this package'
    },
    {
      name: /^@blackbaud\/(help-client|skyux-lib-help)$/,
      reason: 'it is a dependency of @skyux-sdk/builder'
    },
    {
      name: /^@pact-foundation\/$/,
      reason: ''
    },
    {
      name: /^@skyux-sdk\/(builder-plugin-pact|pact)$/,
      reason: ''
    },
    {
      name: /^(@types\/core-js|core-js)$/,
      reason: 'it is a dependency of @skyux-sdk/builder'
    },
    {
      name: /^intl-tel-input$/,
      reason: 'it is a dependency of @skyux/phone-field'
    },
    {
      name: /^rxjs-compat$/,
      reason: 'SKY UX libraries support the latest version of rxjs'
    }
  ];

  packages.forEach((packageToRemove) => {
    [
      'dependencies',
      'devDependencies',
      'peerDependencies'
    ].forEach((section) => {
      if (packageJson[section]) {
        for (let packageName in packageJson[section]) {
          if (packageToRemove.name.test(packageName)) {
            delete packageJson[section][packageName];
            if (packageToRemove.reason) {
              logger.info(`Removed ${packageName} from ${section} because ${packageToRemove.reason}.`);
            }
          }
        }
      }
    });
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
    },
    {
      regexp: /^codelyzer$/,
      version: '^5.0.0'
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

async function migrate(argv) {

  logger.info(`${LOG_SEPARATOR}\nMigration started.\n${LOG_SEPARATOR}`);

  try {

    await cliVersion.verifyLatestVersion();


    // TODO: Check e2e as well. Delete @skyux-sdk/e2e if no e2e tests found.
    await cleanup.deleteDependencies();

    await adjustPackageJson();

    await adjustSkyUxConfigJson();

    await stylesheets.fixSassDeep();

    await icons.migrateIcons();

    await upgrade(argv);

    logger.info('Migration completed successfully.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
