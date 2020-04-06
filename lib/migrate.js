const logger = require('@blackbaud/skyux-logger');

const jsonUtils = require('./utils/json-utils');

/**
 * Removes deprecated and unnecessary packages.
 * @param {Object} packageJson The contents of a package.json file.
 */
function removePackages(packageJson) {
  const packageNames = [
    '@angular/http',
    '@pact-foundation/pact',
    '@pact-foundation/pact-web',
    '@skyux-sdk/pact',
    '@types/core-js',
    'core-js',
    'rxjs-compat'
  ];

  packageNames.forEach((packageName) => {
    delete packageJson.dependencies[packageName];
    delete packageJson.devDependencies[packageName];
    delete packageJson.peerDependencies[packageName];
  });

  return packageJson;
}

async function adjustPackageJson() {
  let packageJson = await jsonUtils.readJson('package.json');

  packageJson = removePackages(packageJson);

  await jsonUtils.writeJson('package.json', packageJson);
}

async function migrate(argv) {

  try {
    await adjustPackageJson();
    logger.info('Done.');
  } catch (error) {
    logger.error('Error: ' + error.message);
    process.exit(1);
  }

}

module.exports = migrate;
