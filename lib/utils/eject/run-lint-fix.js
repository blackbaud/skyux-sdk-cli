const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');
const path = require('path');

function runLintFix(cwd) {
  logger.info('Running `ng lint --fix`...');

  crossSpawn.sync('ng', ['lint', '--fix'], {
    cwd: path.join(cwd),
    stdio: 'inherit'
  });

  logger.info('Done.');
}

module.exports = runLintFix;
