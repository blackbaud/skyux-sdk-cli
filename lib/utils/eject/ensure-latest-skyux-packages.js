const logger = require('@blackbaud/skyux-logger');
const latestVersion = require('latest-version');
const semver = require('semver');

/**
 * Ensures all SKY UX packages are up-to-date.
 */
async function ensureLatestSkyuxPackages(dependencies = {}) {
  const packagesToUpdate = {};
  const promises = [];

  for (const packageName in dependencies) {
    if (/^((@skyux(-sdk)?\/)|(@blackbaud\/)|(@blackbaud-internal\/skyux-.*))/.test(packageName)) {
      const currentVersion = dependencies[packageName];
      packagesToUpdate[packageName] = currentVersion;
    }
  }

  Object.keys(packagesToUpdate).forEach(packageName => {
    const currentVersion = packagesToUpdate[packageName];
    logger.verbose(`Checking latest version for "${packageName}"...`);
    const validRange = semver.validRange(currentVersion);
    promises.push(latestVersion(packageName, {
      version: validRange
    }));
  });

  const latestVersions = await Promise.all(promises);

  Object.keys(packagesToUpdate).forEach((packageName, i) => {
    const currentVersion = packagesToUpdate[packageName];
    const firstChar = currentVersion.charAt(0);
    const rangeSymbol = (firstChar === '^' || firstChar === '~') ? firstChar : '';
    const newVersion = `${rangeSymbol}${latestVersions[i]}`;
    if (dependencies[packageName] !== newVersion) {
      logger.info(`Updated "${packageName}" version to "${newVersion}".`);
      dependencies[packageName] = newVersion;
    }
  });
}

module.exports = ensureLatestSkyuxPackages;
