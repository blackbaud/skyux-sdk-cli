const logger = require('@blackbaud/skyux-logger');

const runNgCommand = require('../../run-ng-command');

function createAngularLibrary(ejectedProjectPath, projectName) {
  logger.info(`Creating an Angular CLI library project named "${projectName}"...`);

  runNgCommand('generate', [
    'library', projectName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

module.exports = createAngularLibrary;
