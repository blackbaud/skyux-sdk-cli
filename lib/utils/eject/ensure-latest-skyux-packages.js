const logger = require('@blackbaud/skyux-logger');
const latestVersion = require('latest-version');
const semver = require('semver');

const SKY_UX_PACKAGE_REGEXP = /^((@skyux(-sdk)?\/)|(@blackbaud\/)|(@blackbaud-internal\/skyux-.*))/;

/**
 * Ensures all SKY UX packages are up-to-date.
 */
async function ensureLatestSkyuxPackages(dependencies = {}) {
  // Get all SKY UX packages.
  const skyuxPackages = {};
  for (const packageName in dependencies) {
    if (SKY_UX_PACKAGE_REGEXP.test(packageName)) {
      const version = dependencies[packageName];
      skyuxPackages[packageName] = version;
    }
  }

  const packagesToUpdate = {};
  for (const packageName in skyuxPackages) {
    let version = skyuxPackages[packageName];

    // Check if the version provided is valid.
    const validRange = semver.validRange(version);
    if (!validRange) {
      logger.warn(`Invalid range provided for "${packageName}" (wanted "${version}"). Skipping.`);
      return;
    }

    // Convert the specific version into a range.
    if (validRange === version) {
      version = `^${version}`;
    }

    packagesToUpdate[packageName] = version;
  }

  const latestVersionPromises = [];
  for (const packageName in packagesToUpdate) {
    const version = packagesToUpdate[packageName];

    logger.verbose(`Checking latest version for "${packageName}"...`);
    latestVersionPromises.push(
      latestVersion(packageName, {
        version
      })
    );
  }

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
      logger.info(`Skipped "${packageName}" because it is already on the latest version.`);
    }
  });
}

module.exports = ensureLatestSkyuxPackages;
