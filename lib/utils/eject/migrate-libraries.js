const spawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');

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
  fs.removeSync(path.join(ejectedProjectPath, 'projects', libraryName, 'src/lib'));
  fs.removeSync(path.join(ejectedProjectPath, 'projects', libraryName, 'src/public-api.ts'));
  fs.copySync(libraryPath, path.join(ejectedProjectPath, 'projects', libraryName, 'src'));
  fs.renameSync(
    path.join(ejectedProjectPath, 'projects', libraryName, 'src/public_api.ts'),
    path.join(ejectedProjectPath, 'projects', libraryName, 'src/public-api.ts')
  );
}

function modifyPackageJson(ejectedProjectPath, libraryName) {
  // Copy peer dependencies. Filter out @skyux-sdk/builder.
  // Copy hard dependencies. Filter out @skyux-sdk/builder.
  const originalPackageJson = getPackageJson();
  const ejectedLibraryPackageJsonPath = path.join(ejectedProjectPath, `projects/${libraryName}/package.json`);
  const ejectedLibraryPackageJson = fs.readJsonSync(ejectedLibraryPackageJsonPath);
  ejectedLibraryPackageJson.peerDependencies = ejectedLibraryPackageJson.peerDependencies || {};
  ejectedLibraryPackageJson.peerDependencies = Object.assign({}, ejectedLibraryPackageJson.peerDependencies, originalPackageJson.peerDependencies || {});
  fs.writeJsonSync(ejectedLibraryPackageJsonPath, ejectedLibraryPackageJson, { spaces: 2 });
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
