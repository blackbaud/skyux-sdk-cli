const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');

function npmCi() {
  logger.info('Running a fresh NPM install...');

  spawn.sync('npm', ['ci'], {
    stdio: 'pipe'
  });

  logger.info('Done.');
}

module.exports = npmCi;
