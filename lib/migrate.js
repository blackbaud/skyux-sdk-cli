const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');

const cliVersion = require('./utils/cli-version');
const icons = require('./utils/icons');
const jsonUtils = require('./utils/json-utils');
const stylesheets = require('./utils/stylesheets');

const cleanup = require('./cleanup');
const upgrade = require('./upgrade');

const LOG_SEPARATOR = '------';

async function pactConfigExists() {
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

/**
 * Removes deprecated and unnecessary packages.
 * @param {Object} packageJson The contents of a package.json file.
 */
async function removePackages(packageJson) {
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
      name: /^@pact-foundation\/.*$/,
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
      name: /^@types\/node$/,
      reason: 'it is a dependency of @skyux-sdk/builder'
    },
    {
      name: /^intl-tel-input$/,
      reason: 'it is a dependency of @skyux/phone-field and @skyux/lookup'
    },
    {
      name: /^microedge-rxstate$/,
      reason: 'it has been replaced by @skyux/list-builder-common'
    },
    {
      name: /^rxjs-compat$/,
      reason: 'SKY UX libraries support the latest version of rxjs'
    }
  ];

  packages.forEach(packageToRemove => {
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

/**
 * Adds required Pact packages if project has appropriate configuration.
 * @param {*} packageJson The contents of a package.json file.
 */
async function checkPactPackages(packageJson) {
  logger.info('Validating Pact dependencies...');

  const enablePact = await pactConfigExists();

  // Pact config not provided; skip adding packages.
  if (!enablePact) {
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
 * Makes necessary changes to the package.json file.
 */
async function adjustPackageJson() {
  let packageJson = await jsonUtils.readJson('package.json');

  packageJson = await removePackages(packageJson);
  packageJson = await checkPactPackages(packageJson);

  // Remove `module` and `main` since ng-packagr handles these values.
  delete packageJson.main;
  delete packageJson.module;

  await jsonUtils.writeJson('package.json', packageJson);
}

/**
 * Makes necessary changes to the skyuxconfig.json file.
 */
async function adjustSkyUxConfigJson() {

  // TODO: Need to loop through ALL skyuxconfig.json files!

  logger.info('Cleaning skyuxconfig.json...');

  let skyuxJson = await jsonUtils.readJson('skyuxconfig.json');

  // Modify omnibar config.
  if (skyuxJson.omnibar) {
    delete skyuxJson.omnibar.experimental;
  }

  // Remove SKY stylesheet (it is provided by Builder).
  if (skyuxJson.app && skyuxJson.app.styles) {
    const index = skyuxJson.app.styles.indexOf('@skyux/theme/css/sky.css');
    if (index > -1) {
      skyuxJson.app.styles.splice(index, 1);
    }
  }

  // Add frame options.
  if (!skyuxJson.host || !skyuxJson.host.frameOptions) {
    skyuxJson.host = skyuxJson.host || {};
    skyuxJson.host.frameOptions = {
      none: true
    };
  }

  // Add Pact Builder plugin.
  const enablePact = await pactConfigExists();
  if (enablePact) {
    skyuxJson.plugins = skyuxJson.plugins || [];
    if (skyuxJson.plugins.indexOf('@skyux-sdk/builder-plugin-pact') === -1) {
      skyuxJson.plugins.push('@skyux-sdk/builder-plugin-pact');
    }
  }

  await jsonUtils.writeJson('skyuxconfig.json', skyuxJson);

  logger.info(`Done.\n${LOG_SEPARATOR}`);
}

/**
 * Checks the entry point of a component library.
 */
async function fixLibraryEntryPoint() {
  const isLibrary = await fs.pathExists('src/app/public/index.ts');
  if (!isLibrary) {
    return;
  }

  // Remove root-level index file because it is not needed anymore.
  await fs.remove('index.ts');

  // Rename the library index file to what ng-packagr recommends.
  await fs.copyFile('src/app/public/index.ts', 'src/app/public/public_api.ts');

  // Rename the testing module index file.
  const hasTestingModule = await fs.pathExists('src/app/public/testing/index.ts');
  if (hasTestingModule) {
    await fs.copyFile('src/app/public/testing/index.ts', 'src/app/public/testing/public_api.ts');
  }
}

async function migrate(argv) {

  logger.info(`${LOG_SEPARATOR}\nMigration started. This might take a few moments...\n${LOG_SEPARATOR}`);

  try {

    await cliVersion.verifyLatestVersion();

    await stylesheets.fixSassDeep();

    await icons.migrateIcons();

    await fixLibraryEntryPoint();

    await adjustSkyUxConfigJson();

    await adjustPackageJson();

    await cleanup.deleteDependencies();

    argv.upgradePeers = true;
    await upgrade(argv);

    logger.info('Migration completed successfully.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
