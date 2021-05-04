const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');

/**
 * Installs the appropriate SKY UX Angular builder.
 */
function installAngularBuilders(ejectedProjectPath, isInternal) {
  const npmPackage = (isInternal)
    ? '@blackbaud-internal/skyux-angular-builders@^5.0.0-alpha.0'
    : '@skyux-sdk/angular-builders';

  logger.info(`Installing ${npmPackage} ...`);

  crossSpawn.sync('ng', [
    'add', npmPackage
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

module.exports = installAngularBuilders;
