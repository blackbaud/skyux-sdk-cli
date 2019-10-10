const fs = require('fs-extra');
const logger = require('@blackbaud/skyux-logger');
const npmInstall = require('./utils/npm-install');
const cloneUtil = require('./utils/clone');

function getResolver(argv) {
  return require(argv.sslRoot);
}

async function clean(argv) {
  if (fs.existsSync(argv.sslRoot)) {
    logger.info(`Removing previous clone of certs from ${argv.sslRoot}`);
    await fs.remove(argv.sslRoot);
  } else {
    logger.info(`Previous clone of certs not found at ${argv.sslRoot}`);
  }
}

async function clone(argv) {
  await cloneUtil('https://github.com/blackbaud/skyux-sdk-certs.git', argv.sslRoot, argv);
  await npmInstall({ path: argv.sslRoot });
}

async function install(argv) {
  logger.info('Installing SKY UX certificate.');
  await clean(argv);
  await clone(argv);
  await trust(argv);
  logger.info('Successfully installed SKY UX certificate.');
}

async function trust(argv) {
  const resolver = getResolver(argv);
  await resolver.trust();
}

async function uninstall(argv) {
  logger.info('Uninstalling SKY UX certificate.');
  await untrust(argv);
  await clean(argv);
  logger.info('Successfully uninstalled SKY UX certificate.');
}

async function untrust(argv) {
  const resolver = getResolver(argv)
  await resolver.untrust();
}

module.exports = async function certs(argv) {
  try {
    switch (argv['_'][1]) {
      case 'clean':
        await clean(argv);
      break;

      case 'clone':
        await clone(argv);
      break;

      case 'install':
        await install(argv);
      break;

      case 'trust':
        await trust(argv);
      break;

      case 'uninstall':
        await uninstall(argv);
      break;

      case 'untrust':
        await untrust(argv);
      break;

      default:
        logger.warn(`Unknown action for the certs command.`);
        logger.warn(`Available actions are clean, clone, install, trust, uninstall, and untrust.`)
      break;
    }
  } catch (err) {
    logger.error(`Command exited with error: ${err}`);
  }
};
