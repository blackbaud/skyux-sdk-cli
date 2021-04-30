const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');

function npmCi() {
  logger.info('Running `npm ci`...');

  spawn.sync('npm', ['ci'], {
    cwd: process.cwd(),
    stdio: 'pipe'
  });

  logger.info('Done.');
}

module.exports = npmCi;
