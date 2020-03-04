const latestVersion = require('latest-version');
const getPackageJson = require('package-json');
const logger = require('@blackbaud/skyux-logger');

const sortUtils = require('../lib/utils/sort-utils');

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

    const peerPromises = skyPackageNames.map(
      packageName => getPackageJson(packageName)
    );

    const packageJsonList = await Promise.all(peerPromises);

    for (const packageJson of packageJsonList) {
      /* istanbul ignore else */
      if (packageJson.peerDependencies) {
        for (const peerDependency of Object.keys(packageJson.peerDependencies)) {
          if (!dependencies[peerDependency]) {
            logger.info(`Adding package ${peerDependency} since it is a peer dependency of ${packageJson.name}...`);
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
    // New dependencies were added, so we need to run the peer check again.
    await addSkyPeerDependencies(dependencies);
  }
}

async function upgradeDependencies(dependencies) {
  if (dependencies) {

    // Make sure any versions listed as 'latest' are converted to
    // the numeric equivalent.
    await setDependencyVersions(dependencies);

    const promises = [];

    for (const packageName in dependencies) {
      const currentVersion = dependencies[packageName];

      let versionRange;

      switch (packageName) {
        case 'typescript':
          versionRange = '~3.6.4';
          logger.info(
            `NOTE: Using version range (${packageName}@${versionRange}) because TypeScript does not support semantic versioning.`
          );
          break;
        case 'zone.js':
          versionRange = '~0.10.2';
          logger.info(
            `NOTE: Using version range (${packageName}@${versionRange}) because Angular requires a specific version of ${packageName}.`
          );
          break;
        default:
          if (
            /^[0-9]+\./.test(currentVersion) ||
            /-(rc|alpha|beta)\./.test(currentVersion)
          ) {
            versionRange = `^${currentVersion}`;
          } else {
            // Allow package.json to request a version based on an NPM tag (e.g. 'next').
            versionRange = currentVersion;
          }

          logger.info(`Finding latest version within range (${packageName}@${versionRange})...`);
          break;
      }

      promises.push(
        latestVersion(packageName, {
          version: `${versionRange}`
        })
      );
    }

    const versionNumbers = await Promise.all(promises);

    Object.keys(dependencies).forEach((packageName, index) => {
      const versionNumber = versionNumbers[index];
      if (dependencies[packageName] === versionNumber) {
        logger.info(`Skipping package update. ${packageName} already set to (${versionNumber}).`);
      } else {
        logger.info(`Updated package ${packageName} to version (${versionNumber}).`);
        dependencies[packageName] = versionNumber;
      }
    });
  }

  fixDependencyOrder(dependencies);
}

module.exports = {
  upgradeDependencies,
  addSkyPeerDependencies,
  fixDependencyOrder
};
