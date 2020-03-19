const latestVersion = require('latest-version');
const getPackageJson = require('package-json');
const semver = require('semver');
const logger = require('@blackbaud/skyux-logger');

const sortUtils = require('../lib/utils/sort-utils');

const LOG_SEPARATOR = '-----';

/**
 * Alphabetizes dependencies, similar to the behavior of `npm install <package> --save`.
 * @param {*} dependencies Dependencies to sort.
 */
function fixDependencyOrder(dependencies) {
  if (dependencies) {
    const sortedDependencies = sortUtils.sortedKeys(dependencies);

    for (const dependency of sortedDependencies) {
      const value = dependencies[dependency];

      delete dependencies[dependency];

      dependencies[dependency] = value;
    }
  }

  return dependencies;
}

/**
 * Finds all dependencies with a version specified as "latest", looks up the package in the global
 * NPM registry, and replaces it with the actual version number of the latest version of the package.
 * @param {*} dependencies The dependencies with versions to resolve.
 */
async function setDependencyVersions(dependencies) {
  const packageNames = Object.keys(dependencies);

  const dependencyPromises = packageNames.map(
    packageName => latestVersion(packageName, {
      version: dependencies[packageName]
    })
  );

  const versionNumbers = await Promise.all(dependencyPromises);

  packageNames.forEach((packageName, index) => {
    dependencies[packageName] = versionNumbers[index];
  });
}

/**
 * Looks up all SKY UX NPM packages' peer dependencies in the NPM registry and adds them to the
 * dependency list.
 * @param {*} dependencies List of top-level dependencies.
 */
async function addSkyPeerDependencies(dependencies) {
  let foundNewDependency = false;

  if (dependencies) {
    const skyPackageNames = Object.keys(dependencies).filter((packageName) => {
      return (
        packageName.indexOf('@skyux/') === 0 ||
        packageName.indexOf('@blackbaud/skyux-lib-') === 0
      );
    });

    const peerPromises = skyPackageNames.map(packageName => {
      const version = dependencies[packageName];
      return getPackageJson(packageName, { version });
    });

    const packageJsonList = await Promise.all(peerPromises);

    const ignoredPackages = [];

    for (const packageJson of packageJsonList) {
      /* istanbul ignore else */
      if (packageJson.peerDependencies) {
        for (const packageName of Object.keys(packageJson.peerDependencies)) {
          if (dependencies[packageName]) {
            continue;
          }

          // Only handle Angular and SKY UX packages.
          if (/^(@angular|@skyux|@blackbaud)/.test(packageName) === false) {
            // We can ignore reporting `tslib` since it's installed by Builder.
            if (packageName !== 'tslib') {
              ignoredPackages.push({
                missingPeer: `${packageName}@${packageJson.peerDependencies[packageName]}`,
                peer: `${packageJson.name}@${packageJson.version}`
              });
            }
            continue;
          }

          logger.info(`Added package ${packageName}@${packageJson.peerDependencies[packageName]} since it is a peer dependency of ${packageJson.name}@${packageJson.version}.`);
          dependencies[packageName] = packageJson.peerDependencies[packageName];
          foundNewDependency = true;
        }
      }
    }

    if (ignoredPackages.length) {
      logger.info('Warning: The following missing peer dependencies were not added because they are not known Angular or SKY UX packages. Do you need to install them yourself?');
      logger.info(LOG_SEPARATOR);
      ignoredPackages.forEach(p => logger.info(
        `${p.missingPeer} --> peer of ${p.peer}`
      ));
      logger.info(LOG_SEPARATOR);
    }

    await setDependencyVersions(dependencies);
  }

  fixDependencyOrder(dependencies);

  if (foundNewDependency) {
    // New dependencies were added, so we need to run the peer check again.
    await addSkyPeerDependencies(dependencies);
  }
}

async function upgradeDependencies(dependencies) {
  if (dependencies) {

    const promises = [];

    for (const packageName in dependencies) {
      const currentVersion = dependencies[packageName];
      const validRange = semver.validRange(currentVersion);

      let versionRange;

      switch (packageName) {
        case 'typescript':
          versionRange = '~3.6.4';
          logger.info(
            `Note: Using version range ${packageName}@${versionRange} because TypeScript does not support semantic versioning.`
          );
          break;
        case 'zone.js':
          versionRange = '~0.10.2';
          logger.info(
            `Note: Using version range ${packageName}@${versionRange} because Angular requires a specific minor version of ${packageName}.`
          );
          break;
        case 'ts-node':
          versionRange = '~8.6.0';
          logger.info(
            `Note: Using version range ${packageName}@${versionRange} because Angular requires a specific minor version of ${packageName}.`
          );
          break;
        default:
          if (validRange === currentVersion) {
            // Convert the specific version into a range.
            versionRange = `^${currentVersion}`;
          } else if (validRange !== null) {
            // Use the validated range.
            versionRange = validRange;
          } else {
            // Current version specifies a dist-tag or git URL.
            versionRange = currentVersion;
          }

          logger.info(`Finding latest version within range ${packageName}@${versionRange}...`);
          break;
      }

      promises.push(
        latestVersion(packageName, {
          version: `${versionRange}`
        })
      );
    }

    const versionNumbers = await Promise.all(promises);

    const updateMessages = [];
    const ignoreMessages = [];

    Object.keys(dependencies).forEach((packageName, index) => {
      const versionNumber = versionNumbers[index];
      if (dependencies[packageName] === versionNumber) {
        ignoreMessages.push(`Skipped package ${packageName} because it is already set to (${versionNumber}).`);
      } else {
        updateMessages.push(`Updated package ${packageName} to (${versionNumber}).`);
      }
      dependencies[packageName] = versionNumber;
    });

    if (ignoreMessages.length) {
      ignoreMessages.forEach(m => logger.info(m));
      logger.info(LOG_SEPARATOR);
    }

    if (updateMessages.length) {
      updateMessages.forEach(m => logger.info(m));
      logger.info(LOG_SEPARATOR);
    }

    logger.info(`Total packages upgraded: ${updateMessages.length}`);
    logger.info(LOG_SEPARATOR);
  }

  fixDependencyOrder(dependencies);
}

module.exports = {
  upgradeDependencies,
  addSkyPeerDependencies,
  fixDependencyOrder
};
