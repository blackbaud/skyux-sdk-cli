const logger = require('@blackbaud/skyux-logger');

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const npmInstall = require('./utils/npm-install');

async function upgrade(argv) {

  // Did the consumer pass `--no-install` via the command line?
  const runInstall = (argv.install !== false);

  // Did the consumer pass `--upgrade-peers` via the command line?
  const upgradePeers = (argv.upgradePeers === true);

  const packageJson = await jsonUtils.readJson('package.json');

  try {
    logger.info('Upgrading dependencies...');
    await appDependencies.upgradeDependencies(packageJson.dependencies);

    logger.info('Upgrading development dependencies...');
    const devDependencies = await appDependencies.upgradeDependencies(packageJson.devDependencies);

    // Update peer dependency versions.
    if (upgradePeers && packageJson.peerDependencies) {
      Object.keys(devDependencies).forEach(packageName => {
        if (packageJson.peerDependencies[packageName]) {
          packageJson.peerDependencies[packageName] = `^${devDependencies[packageName]}`;
        }
      });
    }

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
  }
}

module.exports = upgrade;
