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
  packageJson.devDependencies['tslint-jasmine-rules'] = '^1.6.1';

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

function modifyTsLintJson(builderPackageName) {
  const tsLintJsonPath = path.join(process.cwd(), 'tslint.json');
  const contents = fs.readFileSync(tsLintJsonPath, { encoding: 'utf-8' });
  const modified = contents.replace('"@skyux-sdk/builder/tslint"', `"${builderPackageName}/deprecated/tslint"`);
  fs.writeFileSync(tsLintJsonPath, modified);
}

function setupDeprecatedTsLintBuilder(ejectedProjectPath, projectName, builderPackageName) {
  modifyAngularJson(ejectedProjectPath, projectName);
  modifyPackageJson(ejectedProjectPath);
  modifyTsLintJson(builderPackageName);
}

module.exports = setupDeprecatedTsLintBuilder;
