const logger = require('@blackbaud/skyux-logger');
const latestVersion = require('latest-version');
const semver = require('semver');

/**
 * Ensures all SKY UX packages are up-to-date.
 */
async function ensureLatestSkyuxPackages(dependencies = {}) {
  const skyuxPackages = {};
  for (const packageName in dependencies) {
    if (/^((@skyux(-sdk)?\/)|(@blackbaud\/)|(@blackbaud-internal\/skyux-.*))/.test(packageName)) {
      const currentVersion = dependencies[packageName];
      skyuxPackages[packageName] = currentVersion;
    }
  }

  const packagesToUpdate = {};
  Object.keys(skyuxPackages).forEach((packageName) => {
    let currentVersion = skyuxPackages[packageName];

    const validRange = semver.validRange(currentVersion);
    if (!validRange) {
      logger.warn(`Invalid range provided for "${packageName}" (wanted "${currentVersion}"). Skipping.`);
      return;
    }

    // Convert the specific version into a range.
    if (validRange === currentVersion) {
      currentVersion = `^${currentVersion}`;
    }

    packagesToUpdate[packageName] = currentVersion;
  });

  // TODO: Also gather peer dependencies.

  const latestVersionPromises = [];
  Object.keys(packagesToUpdate).forEach(packageName => {
    const version = packagesToUpdate[packageName];

    logger.verbose(`Checking latest version for "${packageName}"...`);
    latestVersionPromises.push(
      latestVersion(packageName, {
        version
      })
    );
  });

  const latestVersions = await Promise.all(latestVersionPromises);

  Object.keys(packagesToUpdate).forEach((packageName, i) => {
    const currentVersion = packagesToUpdate[packageName];
    const firstChar = currentVersion.charAt(0);
    const rangeSymbol = (firstChar === '^' || firstChar === '~') ? firstChar : '';
    const newVersion = `${rangeSymbol}${latestVersions[i]}`;
    if (dependencies[packageName] !== newVersion) {
      logger.info(`Updated "${packageName}" version to "${newVersion}".`);
      dependencies[packageName] = newVersion;
    } else {
      logger.info(`Package "${packageName}" already up-to-date. Skipping.`);
    }
  });
}

module.exports = ensureLatestSkyuxPackages;
