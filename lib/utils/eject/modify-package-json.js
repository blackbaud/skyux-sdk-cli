const fs = require('fs-extra');
const path = require('path');
const spawn = require('cross-spawn');

const appDependencies = require('../../app-dependencies');

const writeJson = require('./write-json');

const CWD = process.cwd();

function isValidDependency(packageName, rules) {
  const isIncluded = rules.include.find((x) => x.test(packageName));
  const isExcluded = rules.exclude.find((x) => x.test(packageName));
  return isIncluded && !isExcluded;
}

/**
 * Moves (and upgrades) dependencies to the new Angular CLI package.json file.
 */
async function modifyPackageJson(ejectedProjectPath) {
  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  const ejectedPackageJsonPath = path.join(ejectedProjectPath, 'package.json');
  const ejectedPackageJson = fs.readJsonSync(ejectedPackageJsonPath);

  // Dependencies allowed in the `dependencies` section.
  const validDependenciesRules = {
    include: [/^@(angular|blackbaud|skyux)\//, /^(rxjs|tslib|zone.js)$/],
    exclude: [/^@angular\/(cli|compiler-cli)/]
  };

  // Dependencies allowed in the `devDependencies` section.
  const validDevDependenciesRules = {
    include: [
      /^@angular-devkit\//,
      /^@angular\/(cli|compiler-cli)/,
      /^@skyux-sdk\/(e2e|pact|testing)/,
      /^@types\//,
      /^(jasmine|karma)(.*)?/,
      /^(codelyzer|protractor|ts-node|tslint|typescript)$/
    ],
    exclude: []
  };

  // The following dependencies are no longer valid and should be removed.
  const invalidDependencies = [/^@skyux-sdk\/builder(.*)?/];

  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};

  // First, merge all dependencies into a single list.
  // We'll decide which dependencies go in which section later.
  const allDependencies = Object.assign(
    {},
    packageJson.dependencies,
    packageJson.devDependencies,
    ejectedPackageJson.dependencies || {},
    ejectedPackageJson.devDependencies || {}
  );

  const dependencies = {};
  const devDependencies = {};
  const unassigned = {};

  // Assign each dependency to its appropriate section.
  Object.keys(allDependencies).forEach((packageName) => {
    if (isValidDependency(packageName, validDependenciesRules)) {
      dependencies[packageName] = allDependencies[packageName];
      return;
    }

    if (isValidDependency(packageName, validDevDependenciesRules)) {
      devDependencies[packageName] = allDependencies[packageName];
      return;
    }

    // Save any dependencies that we don't recognize for later.
    const isValid = invalidDependencies.find((x) => !x.test(packageName));
    if (isValid) {
      unassigned[packageName] = allDependencies[packageName];
    }
  });

  // Add any unassigned dependencies to their respective section.
  // (Whichever section the consumer's package.json used.)
  Object.keys(unassigned).forEach((packageName) => {
    if (packageJson.dependencies[packageName]) {
      dependencies[packageName] = unassigned[packageName];
    } else {
      devDependencies[packageName] = unassigned[packageName];
    }
  });

  // Make sure all packages are up-to-date.
  await appDependencies.upgradeDependencies(dependencies);
  await appDependencies.upgradeDependencies(devDependencies);

  ejectedPackageJson.dependencies = dependencies;
  ejectedPackageJson.devDependencies = devDependencies;

  writeJson(ejectedPackageJsonPath, ejectedPackageJson);

  // Install the new packages.
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

module.exports = modifyPackageJson;
