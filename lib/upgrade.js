const logger = require('@blackbaud/skyux-logger');
const clonedeep = require('lodash.clonedeep');
const diff = require('deep-object-diff').diff;

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const cleanup = require('../lib/cleanup');

function isReferenced(packageName, packageJson) {
  return (packageJson.devDependencies && packageJson.devDependencies[packageName]) ||
    (packageJson.dependencies && packageJson.dependencies[packageName]);
}

function logVersionUpgrades(dependencies) {
  if (dependencies) {
    for (const [key, value] of Object.entries(dependencies)) {
      logger.error(`${key} can be upgraded to version ${value}`);
    }
  }
}

async function upgrade(argv) {
  let dryrun = false;

  if (argv && argv.dryrun) {
    dryrun = true;
  }

  const packageJson = await jsonUtils.readJson('package.json');
  let originalPackageJson = clonedeep(packageJson);

  await appDependencies.upgradeDependencies(packageJson.dependencies);
  await appDependencies.upgradeDependencies(packageJson.devDependencies);

  await appDependencies.addSkyPeerDependencies(packageJson.dependencies);
  await appDependencies.addSkyPeerDependencies(packageJson.devDependencies);

  if (dryrun) {
    const packageJsonDiff = diff(originalPackageJson, packageJson);
    if (Object.keys(packageJsonDiff).length > 0) {
      logger.error('\nThis project has out of date depenedencies. Here are the out of date dependencies with their latest versions:\n');
      logVersionUpgrades(packageJsonDiff.dependencies);
      logVersionUpgrades(packageJsonDiff.devDependencies);
      process.exit(1);
    }
  } else {
    await jsonUtils.writeJson('package.json', packageJson);

    await cleanup.deleteDependencies();

    let doneMsg = 'Done.';

    if (isReferenced('typescript', packageJson) || isReferenced('zone.js', packageJson)) {
      doneMsg += '  This project includes a reference to TypeScript and/or Zone.js, but the versions ' +
        'were not updated automatically because of Angular\'s version requirements for these libraries.  ' +
        'If running `skyux install` results in a peer dependency warning for one of these libraries, you may ' +
        'need to update these versions manually.';
    }

    logger.info(doneMsg);
  }
}

module.exports = upgrade;
