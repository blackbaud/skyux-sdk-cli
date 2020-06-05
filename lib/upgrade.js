const logger = require('@blackbaud/skyux-logger');
const jsonUtils = require('../lib/utils/json-utils');
const npmInstall = require('./utils/npm-install');
const latestVersion = require('latest-version');

/**
 * Returns the app dependencies utility that's compatible with the
 * currently installed version of SKY UX Builder.
 * @param {*} packageJson The contents of a package.json file.
 */
async function getAppDependenciesUtil(packageJson) {
  const builderVersionInstalled = await latestVersion('@skyux-sdk/builder', {
    version: packageJson.devDependencies['@skyux-sdk/builder']
  });

  const majorVersion = builderVersionInstalled.split('.')[0];
  switch (majorVersion) {
    case '4':
      return require('./app-dependencies');
    default:
      return require('./v3-compat/app-dependencies');
  }
}

async function upgrade(argv) {

  // Did the consumer pass `--no-install` via the command line?
  const runInstall = (argv.install !== false);

  const packageJson = await jsonUtils.readJson('package.json');

  const appDependencies = await getAppDependenciesUtil(packageJson);

  try {
    logger.info('Upgrading dependencies...');
    await appDependencies.upgradeDependencies(packageJson.dependencies);

    logger.info('Upgrading development dependencies...');
    await appDependencies.upgradeDependencies(packageJson.devDependencies);

    logger.info('Checking SKY UX peer dependencies...');
    await appDependencies.addSkyPeerDependencies(packageJson.dependencies);
    await appDependencies.addSkyPeerDependencies(packageJson.devDependencies);

    await jsonUtils.writeJson('package.json', packageJson);

    if (runInstall) {
      logger.info('Done updating package.json.\n');

      const settings = {};
      if (logger.logLevel === 'verbose') {
        settings.stdio = 'inherit';
      }

      await npmInstall(settings);
      logger.info('Done.');
    } else {
      logger.info('Done.');
    }

  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }
}

module.exports = upgrade;
