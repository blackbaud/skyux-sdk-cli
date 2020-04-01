const logger = require('@blackbaud/skyux-logger');
const npmInstall = require('./utils/npm-install');
const cleanup = require('../lib/cleanup');

async function install() {
  try {
    await cleanup.deleteDependencies();
    await npmInstall();
  } catch(e) {
    logger.error(e);
  }
}

module.exports = install;
