const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');

function createAngularLibrary(ejectedProjectPath, projectName) {
  logger.info(`Creating an Angular CLI library project named "${projectName}"...`);

  crossSpawn.sync('ng', [
    'generate', 'library', projectName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

module.exports = createAngularLibrary;
