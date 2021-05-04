const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');

function createAngularWorkspace(ejectedProjectDir, enableStrictMode = false) {
  logger.info(`Creating an empty Angular workspace, located at "./${ejectedProjectDir}"...`);

  const strictModeArg = `--strict=${enableStrictMode ? 'true' : 'false'}`;

  const args = [
    'new',
    'my-workspace',
    '--create-application=false',
    `--directory=${ejectedProjectDir}`,
    '--legacy-browsers',  // Enables support for IE 11
    strictModeArg        // Enables strict mode
  ];

  crossSpawn.sync(
    'ng',
    args,
    {
      stdio: 'inherit'
    }
  );

  logger.info('Done.');
}

function createAngularLibrary(ejectedProjectPath, projectName) {
  logger.info(`Creating an Angular CLI library project named "${projectName}"...`);

  crossSpawn.sync('ng', [
    'generate',
    'library',
    projectName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

async function ejectLibrary(ejectedProjectPath, isInternal, enableStrictMode) {
  logger.info('Ejecting an Angular CLI library (this might take several minutes)...');

  createAngularWorkspace(ejectedProjectPath, enableStrictMode);
  createAngularLibrary(ejectedProjectPath, 'my-lib');

  logger.info('Done ejecting library.');
}

module.exports = ejectLibrary;
