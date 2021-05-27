const logger = require('@blackbaud/skyux-logger');

const cliVersion = require('./utils/cli-version');
const jsonUtils = require('./utils/json-utils');
const pact = require('./utils/pact');
const skyuxConfig = require('./utils/skyux-config');
const skyuxLibraries = require('./utils/skyux-libraries');
const stylesheets = require('./utils/stylesheets');

const cleanup = require('./cleanup');
const upgrade = require('./upgrade');
const getBuildToolMetadata = require('./utils/get-build-tool-metadata');

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
      name: /^@skyux-sdk\/(builder-plugin-pact|pact|cli)$/,
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
    },
    {
      name: /^tslib$/,
      reason: 'it is a dependency of @skyux-sdk/builder'
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

  // Update the version of Builder so that the upgrade command uses the correct version ranges.
  if (packageJson.devDependencies) {
    packageJson.devDependencies['@skyux-sdk/builder'] = '^4.0.0-rc.0';
  }

  // Remove the engines property since it is not used by our pipelines.
  delete packageJson.engines;

  await jsonUtils.writeJson('package.json', packageJson);
}

async function migrate(argv) {

  const buildTool = await getBuildToolMetadata();
  if (
    buildTool.name === '@skyux-sdk/builder' &&
    buildTool.currentlyInstalledMajorVersion === 4
  ) {
    logger.warn('Migration aborted. To migrate a SKY UX 4 project to SKY UX 5, run `skyux eject`.');
    process.exit();
    return;
  }

  logger.info(`${LOG_SEPARATOR}\nMigration started. This might take a few moments...\n${LOG_SEPARATOR}`);

  try {

    // Delete local dependencies first, to prevent any Builder plugins from interfering.
    await cleanup.deleteDependencies();

    await cliVersion.verifyLatestVersion();

    await stylesheets.fixSassDeep();

    await skyuxLibraries.fixEntryPoints();

    await skyuxConfig.validateSkyUxConfigJson();

    await adjustPackageJson();

    await upgrade(argv);

    logger.info('Migration completed successfully.');

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
