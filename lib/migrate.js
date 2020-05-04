const logger = require('@blackbaud/skyux-logger');

const cliVersion = require('./utils/cli-version');
const icons = require('./utils/icons');
const jsonUtils = require('./utils/json-utils');
const pact = require('./utils/pact');
const skyuxConfig = require('./utils/skyux-config');
const skyuxLibraries = require('./utils/skyux-libraries');
const stylesheets = require('./utils/stylesheets');

const cleanup = require('./cleanup');
const upgrade = require('./upgrade');

const LOG_SEPARATOR = '------';

/**
 * Removes deprecated and unnecessary packages.
 * @param {Object} packageJson The contents of a package.json file.
 */
function validateDependencies(packageJson) {
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
      name: /^@blackbaud\/skyux-lib-testing$/,
      reason: 'it has been deprecated in favor of @skyux-sdk/testing. Test fixtures have been migrated to their respective library\'s testing module'
    },
    // Removing Pact dependencies since Pact testing is an optional feature of Builder.
    // These dependencies will be added back (in a later step) if the project includes Pact configuration.
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
 * Makes necessary changes to the package.json file.
 */
async function adjustPackageJson() {
  let packageJson = await jsonUtils.readJson('package.json');

  packageJson = validateDependencies(packageJson);
  packageJson = await pact.validateDependencies(packageJson);
  packageJson = skyuxLibraries.validatePackageJson(packageJson);

  await jsonUtils.writeJson('package.json', packageJson);
}

async function migrate(argv) {

  logger.info(`${LOG_SEPARATOR}\nMigration started. This might take a few moments...\n${LOG_SEPARATOR}`);

  try {

    await cliVersion.verifyLatestVersion();

    await stylesheets.fixSassDeep();

    await icons.migrateIcons();

    await skyuxLibraries.fixEntryPoints();

    await skyuxConfig.validateSkyUxConfigJson();

    await adjustPackageJson();

    await cleanup.deleteDependencies();

    await upgrade(argv);

    logger.info('Migration completed successfully.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
