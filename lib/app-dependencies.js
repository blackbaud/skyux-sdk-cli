const logger = require('@blackbaud/skyux-logger');
const latestVersion = require('latest-version');
const getPackageJson = require('package-json');
const semver = require('semver');

const sortUtils = require('../lib/utils/sort-utils');

const LOG_SEPARATOR = '-----';

/**
 * Alphabetizes dependencies, similar to the behavior of `npm install <package> --save`.
 * @param {*} dependencies Dependencies to sort.
 */
function fixDependencyOrder(dependencies) {
  const sortedDependencies = sortUtils.sortedKeys(dependencies);

  for (const dependency of sortedDependencies) {
    const value = dependencies[dependency];

    delete dependencies[dependency];

    dependencies[dependency] = value;
  }

  return dependencies;
}

function validateDependencies(dependencies) {
  const validDependencies = {};
  const invalidDependencies = {};

  for (const packageName in dependencies) {
    const currentVersion = dependencies[packageName];
    if (
      semver.valid(currentVersion) ||
      semver.validRange(currentVersion) ||
      // By default, other than latest, no tag has any special significance to npm itself.
      // See: https://docs.npmjs.com/cli/dist-tag#purpose
      currentVersion === 'latest'
    ) {
      validDependencies[packageName] = currentVersion;
    } else {
      invalidDependencies[packageName] = currentVersion;
    }
  }

  return {
    validDependencies: fixDependencyOrder(validDependencies),
    invalidDependencies: fixDependencyOrder(invalidDependencies)
  };
}

/**
 * Finds all dependencies with a version specified as "latest", looks up the package in the global
 * NPM registry, and replaces it with the actual version number of the latest version of the package.
 * @param {*} dependencies The dependencies with versions to resolve.
 */
async function setDependencyVersions(dependencies) {
  const { validDependencies } = validateDependencies(dependencies);
  const packageNames = Object.keys(validDependencies);

  const dependencyPromises = packageNames.map(
    packageName => latestVersion(packageName, {
      version: validDependencies[packageName]
    })
  );

  const versionNumbers = await Promise.all(dependencyPromises);

  // Update dependency versions.
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
    const { validDependencies } = validateDependencies(dependencies);

    const skyPackageNames = Object.keys(validDependencies)
      .filter((packageName) => {
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

    /* istanbul ignore else */
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

  if (foundNewDependency) {
    // New dependencies were added, so we need to run the peer check again.
    await addSkyPeerDependencies(dependencies);
  }
}

async function upgradeDependencies(dependencies) {
  if (dependencies) {

    fixDependencyOrder(dependencies);

    const {
      validDependencies,
      invalidDependencies
    } = validateDependencies(dependencies);

    const packageConfigs = [
      {
        name: 'codelyzer',
        version: '^5.2.2',
        reason: 'Angular requires a specific major version'
      },
      {
        name: 'ts-node',
        version: '~8.3.0',
        reason: 'Angular requires a specific minor version'
      },
      {
        name: 'tslint',
        version: '~6.1.0',
        reason: 'Angular requires a specific minor version'
      },
      {
        name: 'typescript',
        version: '~3.8.3',
        reason: 'TypeScript does not support semantic versioning'
      },
      {
        name: 'zone.js',
        version: '~0.10.2',
        reason: 'Angular requires a specific minor version'
      },
      {
        regexp: /^@angular\//,
        version: `^9.0.0`
      },
      {
        regexp: /^@blackbaud\/skyux-lib-stache$/,
        version: '^4.0.0-rc.0'
      },
      {
        regexp: /^@blackbaud\/skyux-lib-(clipboard|code-block|media|restricted-view)$/,
        version: '^2.0.0-rc.0'
      },
      {
        regexp: /^@skyux\/(?!auth-client-factory)/,
        version: '^4.0.0-rc.0'
      },
      {
        regexp: /^@skyux-sdk\/(builder|e2e|pact|testing)$/,
        version: '^4.0.0-rc.0'
      },
      {
        regexp: /^@skyux-sdk\/builder-plugin-(pact|skyux)$/,
        version: '^4.0.0-rc.0'
      }
    ];

    // Make sure specific packages are set to supported version ranges.
    let dependencyRanges = {};
    packageConfigs.forEach((packageConfig) => {
      Object.keys(validDependencies).forEach(packageName => {
        if (
          (packageConfig.name && packageName === packageConfig.name) ||
          (packageConfig.regexp && packageConfig.regexp.test(packageName))
        ) {
          dependencyRanges[packageName] = packageConfig.version;
          if (packageConfig.reason) {
            logger.info(`Note: Using version range ${packageName}@${packageConfig.version} because ${packageConfig.reason}.`);
          }
        }
      });
    });

    // Assign latest version ranges for all other packages.
    Object.keys(validDependencies).forEach((packageName) => {
      if (dependencyRanges[packageName]) {
        return;
      }
      const currentVersion = validDependencies[packageName];
      let validRange = semver.validRange(currentVersion);
      let versionRange;
      if (validRange === currentVersion) {
        // Convert the specific version into a range.
        versionRange = `^${currentVersion}`;
      } else if (currentVersion === 'latest') {
        // Use 'latest' dist-tag.
        versionRange = currentVersion;
      } else {
        // Use the validated range.
        versionRange = validRange;
      }
      dependencyRanges[packageName] = versionRange;
    });

    // Reorder dependency ranges so that the index lookup is the same as the valid dependencies.
    dependencyRanges = fixDependencyOrder(dependencyRanges);

    const promises = [];
    for (const packageName in dependencyRanges) {
      const versionRange = dependencyRanges[packageName];
      logger.info(`Finding latest version within range ${packageName}@${versionRange}...`);
      promises.push(
        latestVersion(packageName, {
          version: `${versionRange}`
        })
      );
    }

    const versionNumbers = await Promise.all(promises);

    const updateMessages = [];
    const ignoreMessages = [];

    Object.keys(validDependencies).forEach((packageName, index) => {
      const versionNumber = versionNumbers[index];

      // Update the dependency version.
      dependencies[packageName] = versionNumber;

      // Add logger messages.
      if (validDependencies[packageName] === versionNumber) {
        ignoreMessages.push(`Skipped package ${packageName} because it is already set to (${versionNumber}).`);
      } else {
        updateMessages.push(`Updated package ${packageName} to (${versionNumber}).`);
      }
    });

    if (ignoreMessages.length) {
      ignoreMessages.forEach(m => logger.info(m));
      logger.info(LOG_SEPARATOR);
    }

    if (updateMessages.length) {
      updateMessages.forEach(m => logger.info(m));
      logger.info(LOG_SEPARATOR);
    }

    const invalidPackages = Object.keys(invalidDependencies);
    if (invalidPackages.length) {
      invalidPackages.forEach((packageName) => {
        const version = invalidDependencies[packageName];
        logger.warn(`Warning: Skipped package ${packageName} because it did not provide a valid version or range: "${version}".`);
      });
      logger.info(LOG_SEPARATOR);
      logger.info(`Total packages with invalid versions: ${invalidPackages.length}`);
    }

    logger.info(`Total packages upgraded: ${updateMessages.length}`);
    logger.info(`Total packages skipped: ${ignoreMessages.length}`);

    logger.info(LOG_SEPARATOR);

    dependencies = fixDependencyOrder(dependencies);
  }

  return dependencies;
}

module.exports = {
  upgradeDependencies,
  addSkyPeerDependencies,
  fixDependencyOrder
};
