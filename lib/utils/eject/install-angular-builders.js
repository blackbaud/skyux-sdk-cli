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

  const result = crossSpawn.sync('ng', [
    'add', npmPackage
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  // Angular's error messages do not bubble up to parent processes,
  // so we have to rely on the status code.
  if (result.status === 1) {
    throw new Error(`Failed to add ${npmPackage} to project.`);
  }

  logger.info('Done.');
}

module.exports = installAngularBuilders;
