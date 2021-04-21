const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');
const appDependencies = require('../../app-dependencies');

function generateAngularCliProject(ejectedProjectPath, libraryName) {
  spawn.sync('ng', [
    'generate', 'library', libraryName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

function copyFiles(libraryPath, ejectedProjectPath, libraryName) {
  fs.removeSync(path.join(ejectedProjectPath, `projects/${libraryName}/src/lib`));
  fs.removeSync(path.join(ejectedProjectPath, `projects/${libraryName}/src/public-api.ts`));

  fs.copySync(libraryPath, path.join(ejectedProjectPath, `projects/${libraryName}/src`));

  fs.renameSync(
    path.join(ejectedProjectPath, `projects/${libraryName}/src/public_api.ts`),
    path.join(ejectedProjectPath, `projects/${libraryName}/src/public-api.ts`)
  );
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
      ejectedPackageJson[section] || {},
      packageJson[section] || {}
    ),
    (packageName) => packageName !== '@skyux-sdk/builder'
  );

  if (Object.keys(filtered).length) {
    ejectedPackageJson[section] = appDependencies.upgradeDependencies(filtered);
  }
}

function modifyPackageJson(ejectedProjectPath, libraryName) {
  const packageJson = getPackageJson();
  const ejectedPackageJsonPath = path.join(ejectedProjectPath, `projects/${libraryName}/package.json`);
  const ejectedPackageJson = fs.readJsonSync(ejectedPackageJsonPath);

  modifyDependencies(packageJson, ejectedPackageJson, 'dependencies');
  modifyDependencies(packageJson, ejectedPackageJson, 'peerDependencies');

  fs.writeJsonSync(
    ejectedPackageJsonPath,
    ejectedPackageJson,
    { spaces: 2 }
  );
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
