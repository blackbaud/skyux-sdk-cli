const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');

function generateAngularCliProject(ejectedProjectPath, libraryName) {
  logger.info(`Generating Angular library named "${libraryName}"...`);

  spawn.sync('ng', [
    'generate', 'library', libraryName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

function copyFiles(libraryPath, ejectedProjectPath, libraryName) {
  logger.info('Copying library source files...');

  fs.removeSync(path.join(ejectedProjectPath, `projects/${libraryName}/src/lib`));
  fs.removeSync(path.join(ejectedProjectPath, `projects/${libraryName}/src/public-api.ts`));

  fs.copySync(libraryPath, path.join(ejectedProjectPath, `projects/${libraryName}/src`));

  fs.renameSync(
    path.join(ejectedProjectPath, `projects/${libraryName}/src/public_api.ts`),
    path.join(ejectedProjectPath, `projects/${libraryName}/src/public-api.ts`)
  );

  logger.info('Done.');
}

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

  const packageJson = getPackageJson();
  const ejectedPackageJsonPath = path.join(ejectedProjectPath, `projects/${libraryName}/package.json`);
  const ejectedPackageJson = fs.readJsonSync(ejectedPackageJsonPath);

  modifyDependencies(packageJson, ejectedPackageJson, 'dependencies');
  modifyDependencies(packageJson, ejectedPackageJson, 'peerDependencies');

  ejectedPackageJson.name = packageJson.name;
  ejectedPackageJson.version = packageJson.version;

  fs.writeJsonSync(
    ejectedPackageJsonPath,
    ejectedPackageJson,
    { spaces: 2 }
  );

  logger.info('Done.');
}

function getPackageJson() {
  return fs.readJsonSync(path.join(process.cwd(), 'package.json'));
}

function getName() {
  const packageJson = getPackageJson();
  return packageJson.name.replace(/(^@.*\/)?/, '');
}

module.exports = {
  generateAngularCliProject,
  getName,
  copyFiles,
  modifyPackageJson
};
