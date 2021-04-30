const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');

function npmCi() {
  logger.info('Running `npm ci`...');

  spawn.sync('npm', ['ci'], {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  logger.info('Done.');
}

module.exports = npmCi;
