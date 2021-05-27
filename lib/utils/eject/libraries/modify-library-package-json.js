const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

function filterDependencies(dependencies, test) {
  return Object.keys(dependencies)
    .filter(test)
    .reduce((obj, key) => {
      obj[key] = dependencies[key];
      return obj;
    }, {});
}

function modifyDependencies(packageJson, ejectedPackageJson, section) {
  const filtered = filterDependencies(
    Object.assign(
      {},
      packageJson[section] || {},
      ejectedPackageJson[section] || {}
    ),
    (packageName) => packageName !== '@skyux-sdk/builder'
  );

  if (Object.keys(filtered).length) {
    ejectedPackageJson[section] = filtered;
  }
}

function modifyPackageJson(ejectedProjectPath, libraryName) {
  logger.info('Preparing library package.json...');

  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  const ejectedPackageJsonPath = path.join(
    ejectedProjectPath,
    `projects/${libraryName}/package.json`
  );
  const ejectedPackageJson = fs.readJsonSync(ejectedPackageJsonPath);

  modifyDependencies(packageJson, ejectedPackageJson, 'dependencies');
  modifyDependencies(packageJson, ejectedPackageJson, 'peerDependencies');

  ejectedPackageJson.name = packageJson.name;
  ejectedPackageJson.version = packageJson.version;

  fs.writeJsonSync(ejectedPackageJsonPath, ejectedPackageJson, { spaces: 2 });

  logger.info('Done.');
}

module.exports = modifyPackageJson;
