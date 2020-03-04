const latestVersion = require('latest-version');
const getPackageJson = require('package-json');
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
    packageName => dependencies[packageName] === 'latest' ?
      latestVersion(packageName) :
      // Default to the specified version.
      Promise.resolve(dependencies[packageName])
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

    for (const packageJson of packageJsonList) {
      /* istanbul ignore else */
      if (packageJson.peerDependencies) {
        for (const peerDependency of Object.keys(packageJson.peerDependencies)) {
          if (!dependencies[peerDependency]) {
            logger.info(`Added package ${peerDependency} since it is a peer dependency of ${packageJson.name}@${packageJson.version}.`);
            dependencies[peerDependency] = 'latest';
            foundNewDependency = true;
          }
        }
      }
    }

    await setDependencyVersions(dependencies);
  }

  fixDependencyOrder(dependencies);

  if (foundNewDependency) {
    logger.info(LOG_SEPARATOR);

    // New dependencies were added, so we need to run the peer check again.
    await addSkyPeerDependencies(dependencies);
  }
}

async function upgradeDependencies(dependencies) {
  if (dependencies) {

    const promises = [];

    for (const packageName in dependencies) {
      const currentVersion = dependencies[packageName];

      let versionRange;

      switch (packageName) {
        case 'typescript':
          versionRange = '~3.6.4';
          logger.info(
            `NOTE: Using version range ${packageName}@${versionRange} because TypeScript does not support semantic versioning.`
          );
          break;
        case 'zone.js':
          versionRange = '~0.10.2';
          logger.info(
            `NOTE: Using version range ${packageName}@${versionRange} because Angular requires a specific minor version of ${packageName}.`
          );
          break;
        case 'ts-node':
          versionRange = '~8.6.0';
          logger.info(
            `NOTE: Using version range ${packageName}@${versionRange} because Angular requires a specific minor version of ${packageName}.`
          );
          break;
        default:
          if (
            /^[0-9]+\./.test(currentVersion) ||
            /-(rc|alpha|beta)\./.test(currentVersion)
          ) {
            versionRange = `^${currentVersion.replace('^', '').replace('~', '')}`;
          } else {
            // Allow package.json to request a version based on an NPM tag (e.g. 'next').
            versionRange = currentVersion;
          }

          logger.info(`Finding latest version within range: ${packageName}@${versionRange}.`);
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
        ignoreMessages.push(`Skipping package ${packageName} because it is already set to (${versionNumber}).`);
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
  }

  fixDependencyOrder(dependencies);
}

module.exports = {
  upgradeDependencies,
  addSkyPeerDependencies,
  fixDependencyOrder
};
