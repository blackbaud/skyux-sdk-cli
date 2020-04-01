const logger = require('@blackbaud/skyux-logger');
const npmInstall = require('./utils/npm-install');
const cleanup = require('../lib/cleanup');

const settings = {};

if (logger.logLevel === 'verbose') {
  settings.stdio = 'inherit';
}

async function install() {
  try {
    await cleanup.deleteDependencies();
    await npmInstall(settings);
  } catch(e) {
    logger.error(e);
  }
}

module.exports = install;
