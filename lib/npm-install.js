const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');

/**
 * Runs npm install for a specific package
 * @name npmInstall
 */
function npmInstall(settings) {
  const message = logger.promise('Running npm install (can take several minutes)');

  const installArgs = {};

  if (settings) {
    if (settings.path) {
      installArgs.cwd = settings.path;
    }

    if (settings.stdio) {
      installArgs.stdio = settings.stdio;
    }
  }

  if (fs.existsSync('package-lock.json')) {
    fs.removeSync('package-lock.json');
  }

  const npmProcess = spawn('npm', ['install'], installArgs);

  return new Promise((resolve, reject) => {
    npmProcess.on('exit', (code) => {
      if (code !== 0) {
        message.fail();
        reject('npm install failed.');
        return;
      }

      message.succeed();
      resolve();
    });
  });
}

module.exports = npmInstall;
