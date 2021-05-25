const logger = require('@blackbaud/skyux-logger');
const path = require('path');

const runNgCommand = require('../run-ng-command');

function runLintFix(cwd) {
  logger.info('Running `ng lint --fix`...');

  runNgCommand('lint', ['--fix'], {
    cwd: path.join(cwd),
    stdio: 'inherit'
  });

  logger.info('Done.');
}

module.exports = runLintFix;
