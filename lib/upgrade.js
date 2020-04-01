const logger = require('@blackbaud/skyux-logger');

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const npmInstall = require('./utils/npm-install');

async function upgrade(argv) {

  // Did the consumer pass `--no-install` via the command line?
  const runInstall = (argv.install !== false);

  const packageJson = await jsonUtils.readJson('package.json');

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
      await npmInstall();
      logger.info('Done.');
    } else {
      logger.info('Done.');
    }

  } catch (error) {
    logger.error('Error: ' + error.message);
  }
}

module.exports = upgrade;
