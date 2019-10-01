const latestVersion = require('latest-version');
const getPackageJson = require('package-json');
const logger = require('@blackbaud/skyux-logger');

const sortUtils = require('../lib/sort-utils');

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
    const dependencyPromises = [];

    // Make sure any versions listed as 'latest' are converted to
    // the numeric equivalent.
    await setDependencyVersions(dependencies);

    const packageNames = Object.keys(dependencies);

    for (const packageName of packageNames) {
      const currentVersion = dependencies[packageName];

      let dependencyPromise;

      if (/^[0-9]+\./.test(currentVersion)) {
        let majorVersion = currentVersion.split('.')[0];

        // Handle prerelease versions.
        if (/-(rc|alpha|beta)\./.test(currentVersion)) {
          majorVersion = `^${currentVersion}`;
        }

        logger.info(`Getting latest ${packageName} version for major version ${majorVersion}...`);

        dependencyPromise = latestVersion(
          packageName,
          {
            version: `${majorVersion}`
          }
        );
      } else {
        dependencyPromise = Promise.resolve(currentVersion);
      }

      dependencyPromises.push(dependencyPromise);
    }

    const versionNumbers = await Promise.all(dependencyPromises);

    packageNames.forEach((packageName, index) => {
      const versionNumber = versionNumbers[index];
      switch (packageName) {
        case 'typescript':
          logger.info('Skipping TypeScript because it does not use semantic versioning.');
          break;
        case 'zone.js':
          logger.info('Skipping Zone.js because Angular requires a specific minor version.');
          break;
        default:
          if (dependencies[packageName] === versionNumber) {
            logger.info(`Package ${packageName} already on latest version (${versionNumber})`);
          } else {
            logger.info(`Updating package ${packageName} to version ${versionNumber}`);
            dependencies[packageName] = versionNumber;
          }
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
