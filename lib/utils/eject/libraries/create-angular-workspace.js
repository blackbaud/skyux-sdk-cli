const logger = require('@blackbaud/skyux-logger');
const path = require('path');

const runNgCommand = require('../../run-ng-command');

function createAngularWorkspace(
  ejectedProjectPath,
  workspaceName,
  strictMode
) {
  const ejectedProjectDir = path.basename(ejectedProjectPath);

  logger.info(`Creating an empty Angular workspace named "${workspaceName}", located at "./${ejectedProjectDir}"...`);

  const args = [
    workspaceName,
    '--create-application=false',
    `--directory=${ejectedProjectDir}`,
    `--strict=${strictMode ? 'true' : 'false'}`
  ];


  runNgCommand('new', args);

  logger.info('Done.');
}

module.exports = createAngularWorkspace;
