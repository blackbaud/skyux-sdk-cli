const fs = require('fs-extra');
const path = require('path');
const spawn = require('cross-spawn');

const appDependencies = require('../../app-dependencies');

const writeJson = require('./write-json');

const CWD = process.cwd();

// function filterDependencies(dependencies, test) {
//   return Object.keys(dependencies)
//   .filter(test)
//   .reduce((obj, key) => {
//     obj[key] = dependencies[key];
//     return obj;
//   }, {});
// }

// async function modifyDependencies(packageJson, ejectedPackageJson, section) {
//   packageJson[section] = packageJson[section] || {};
//   ejectedPackageJson[section] = ejectedPackageJson[section] || {};

//   const nonSkyuxSdkDependencies = filterDependencies(
//     packageJson[section],
//     key => key.indexOf('@skyux-sdk/') === -1
//   );

//   const skyuxDependencies = filterDependencies(
//     nonSkyuxSdkDependencies,
//     key => /^(@skyux|@blackbaud|@blackbaud-internal)\//.test(key)
//   );

//   await appDependencies.upgradeDependencies(skyuxDependencies);

//   const merged = Object.assign({}, nonSkyuxSdkDependencies, skyuxDependencies, ejectedPackageJson[section]);
//   ejectedPackageJson[section] = merged;
// }

// function sortObject(obj) {
//   return Object.keys(obj).sort().reduce((result, key) => {
//     result[key] = obj[key];
//     return result;
//   }, {});
// }

/**
 * Moves (and upgrades) any SKY UX dependencies to the new Angular CLI package.json file.
 */
async function modifyPackageJson(ejectedProjectPath) {
  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  const ejectedPackageJsonPath = path.join(ejectedProjectPath, 'package.json');
  const ejectedPackageJson = fs.readJsonSync(ejectedPackageJsonPath);

  // TODO:
  // - Check peer dependencies and move them from devDependencies to dependencies.
  // - Verify dependencies/devDependencies (e.g. no @skyux-sdk/builder in dependencies)

  const validDependencies = {
    include: [
      /^@angular\//,
      /^@blackbaud\//,
      /^@skyux\//,
      /^rxjs$/,
      /^tslib$/,
      /^zone.js$/
    ],
    exclude: [
      /^@angular\/(cli|compiler-cli)/
    ]
  };

  const validDevDependencies = {
    include: [
      /^@angular-devkit\//,
      /^@angular\/(cli|compiler-cli)/,
      /^@skyux-sdk\/(e2e|pact|testing)/,
      /^@types\//,
      /^codelyzer$/,
      /^jasmine/,
      /^karma/,
      /^protractor$/,
      /^(ts-node|tslint|typescript)$/
    ],
    exclude: []
  };

  const allDependencies = Object.assign(
    {},
    packageJson.dependencies || {},
    packageJson.devDependencies || {},
    ejectedPackageJson.dependencies || {},
    ejectedPackageJson.devDependencies || {}
  );

  const invalidDependencies = [
    /^@skyux-sdk\/builder(.*)?/
  ];

  const approvedDependencies = {};
  const approvedDevDependencies = {};

  const unassigned = {};

  Object.keys(allDependencies).forEach(packageName => {
    let isIncluded = validDependencies.include.find(x => x.test(packageName));
    let isExcluded = validDependencies.exclude.find(x => x.test(packageName));
    if (isIncluded && !isExcluded) {
      approvedDependencies[packageName] = allDependencies[packageName];
      return;
    }

    isIncluded = validDevDependencies.include.find(x => x.test(packageName));
    isExcluded = validDevDependencies.exclude.find(x => x.test(packageName));
    if (isIncluded && !isExcluded) {
      approvedDevDependencies[packageName] = allDependencies[packageName];
      return;
    }

    const isValid = invalidDependencies.find(x => !x.test(packageName));
    if (isValid) {
      unassigned[packageName] = allDependencies[packageName];
    }
  });

  // Add any unassigned dependencies to their respective section.
  Object.keys(unassigned).forEach(packageName => {
    if (packageJson.dependencies[packageName]) {
      approvedDependencies[packageName] = unassigned[packageName];
      return;
    }
    if (packageJson.devDependencies[packageName]) {
      approvedDevDependencies[packageName] = unassigned[packageName];
    }
  });

  await appDependencies.upgradeDependencies(approvedDependencies);
  await appDependencies.upgradeDependencies(approvedDevDependencies);

  ejectedPackageJson.dependencies = approvedDependencies;
  ejectedPackageJson.devDependencies = approvedDevDependencies;

  writeJson(
    ejectedPackageJsonPath,
    ejectedPackageJson
  );

  // Install the new packages.
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

module.exports = modifyPackageJson;
