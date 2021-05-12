const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');

function runLintFix(cwd) {
  logger.info('Running `ng lint --fix`...');

  crossSpawn.sync('ng', ['lint', '--fix'], {
    cwd,
    stdio: 'inherit'
  });

  logger.info('Done.');
}

module.exports = runLintFix;
