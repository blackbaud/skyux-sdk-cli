const path = require('path');
const logger = require('@blackbaud/skyux-logger');

/**
 * Displays the current version.
 * @name getVersion
 */
function getVersion() {
  const packageJson = require(path.resolve(__dirname, '..', 'package.json'));
  return packageJson.version;
}

/**
 * Logs the current version.
 * @name logVersion
 */
function logVersion() {
  logger.info(`@skyux-sdk/cli: ${getVersion()}`);
}

module.exports = {
  getVersion: getVersion,
  logVersion: logVersion
};
