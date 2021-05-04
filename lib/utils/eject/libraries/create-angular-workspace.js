const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');
const path = require('path');

function createAngularWorkspace(ejectedProjectPath, workspaceName, strictMode = false) {
  const ejectedProjectDir = path.basename(ejectedProjectPath);

  logger.info(`Creating an empty Angular workspace named "${workspaceName}", located at "./${ejectedProjectDir}"...`);

  const args = [
    'new', workspaceName,
    '--create-application=false',
    `--directory=${ejectedProjectDir}`,
    `--strict=${strictMode ? 'true' : 'false'}`
  ];

  crossSpawn.sync('ng', args, {
    stdio: 'inherit'
  });

  logger.info('Done.');
}

module.exports = createAngularWorkspace;
