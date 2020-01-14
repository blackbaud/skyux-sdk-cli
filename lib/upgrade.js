const logger = require('@blackbaud/skyux-logger');

const appDependencies = require('../lib/app-dependencies');
const jsonUtils = require('../lib/utils/json-utils');
const cleanup = require('../lib/cleanup');

function isReferenced(packageName, packageJson) {
  return (packageJson.devDependencies && packageJson.devDependencies[packageName]) ||
    (packageJson.dependencies && packageJson.dependencies[packageName]);
}

async function upgrade() {

  const packageJson = await jsonUtils.readJson('package.json');

  await appDependencies.upgradeDependencies(packageJson.dependencies);
  await appDependencies.upgradeDependencies(packageJson.devDependencies);

  await appDependencies.addSkyPeerDependencies(packageJson.dependencies);
  await appDependencies.addSkyPeerDependencies(packageJson.devDependencies);

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

module.exports = upgrade;
