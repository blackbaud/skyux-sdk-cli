const fs = require('fs-extra');
const path = require('path');

function readJson(fileName) {
  return fs.readJsonSync(fileName);
}

function writeJson(fileName, contents) {
  fs.writeJsonSync(fileName, contents, { spaces: 2 });
}

function modifyPackageJson(ejectedProjectPath) {
  const packageJsonPath = path.join(ejectedProjectPath, 'package.json');
  const packageJson = readJson(packageJsonPath);

  packageJson.devDependencies['codelyzer'] = '^6.0.0';
  packageJson.devDependencies['tslint'] = '~6.1.0';

  writeJson(packageJsonPath, packageJson);
}

function modifyAngularJson(ejectedProjectPath, projectName) {
  const angularJsonPath = path.join(ejectedProjectPath, 'angular.json');
  const angularJson = readJson(angularJsonPath);

  angularJson.projects[projectName].architect.lint = {
    builder: '@angular-devkit/build-angular:tslint',
    options: {
      tsConfig: [
        'tsconfig.app.json',
        'tsconfig.spec.json'
      ],
      exclude: [
        '**/node_modules/**'
      ]
    }
  };

  writeJson(angularJsonPath, angularJson);
}

function setupDeprecatedTsLintBuilder(ejectedProjectPath, projectName) {
  modifyAngularJson(ejectedProjectPath, projectName);
  modifyPackageJson(ejectedProjectPath);
}

module.exports = setupDeprecatedTsLintBuilder;
