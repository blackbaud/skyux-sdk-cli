const logger = require('@blackbaud/skyux-logger');

const runNgCommand = require('../run-ng-command');

function ngAddPackage(npmPackage, ejectedProjectPath) {
  logger.info(`Installing "${npmPackage}"...`);

  const result = runNgCommand('add', [
    npmPackage,
    '--skip-confirmation'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  // Angular's error messages do not bubble up to parent processes,
  // so we have to rely on the status code.
  if (result.status === 1) {
    throw new Error(`Failed to add "${npmPackage}" to project.`);
  }

  logger.info(`Done installing "${npmPackage}".`);
}

/**
 * Installs SKY UX Angular builders.
 */
function installAngularBuilders(ejectedProjectPath, isInternal, skipCompat = false) {
  const npmPackage = (isInternal)
    ? '@blackbaud-internal/skyux-angular-builders@next'
    : '@skyux-sdk/angular-builders@next';

  ngAddPackage(npmPackage, ejectedProjectPath);

  if (!skipCompat) {
    ngAddPackage('@skyux-sdk/angular-builders-compat@next', ejectedProjectPath);
  }
}

module.exports = installAngularBuilders;
