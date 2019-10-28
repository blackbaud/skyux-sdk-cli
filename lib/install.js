const fs = require('fs-extra');
const logger = require('@blackbaud/skyux-logger');
const npmInstall = require('./utils/npm-install');

const settings = {};

if (logger.logLevel === 'verbose') {
  settings.stdio = 'inherit';
}

function remove(target) {
  const message = logger.promise(`Remove ${target}.`);

  return fs.remove(target)
    .then(() => message.succeed())
    .catch(err => {
      message.fail();
      logger.error(err);
    });
}

function removeNodeModules() {
  return remove('node_modules');
}

function removePackageLock() {
  return remove('package-lock.json');
}

function install() {
  return removeNodeModules()
    .then(() => removePackageLock())
    .then(() => npmInstall(settings))
    .catch(logger.error);
}

module.exports = install;
