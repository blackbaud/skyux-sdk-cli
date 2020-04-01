const logger = require('@blackbaud/skyux-logger');

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const cleanup = require('../lib/cleanup');

async function upgrade() {

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

    await cleanup.deleteDependencies();

    logger.info('Done.');
  } catch (error) {
    logger.error('Error: ' + error.message);
  }
}

module.exports = upgrade;
