const logger = require('@blackbaud/skyux-logger');

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const cleanup = require('../lib/cleanup');

async function upgrade() {

  const packageJson = await jsonUtils.readJson('package.json');

  await appDependencies.upgradeDependencies(packageJson.dependencies);
  await appDependencies.upgradeDependencies(packageJson.devDependencies);

  await appDependencies.addSkyPeerDependencies(packageJson.dependencies);
  await appDependencies.addSkyPeerDependencies(packageJson.devDependencies);

  await jsonUtils.writeJson('package.json', packageJson);

  await cleanup.deleteDependencies();

  logger.info('Done.');
}

module.exports = upgrade;
