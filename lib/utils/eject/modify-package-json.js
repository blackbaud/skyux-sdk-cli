const fs = require('fs-extra');
const path = require('path');
const spawn = require('cross-spawn');

const appDependencies = require('../../app-dependencies');

const writeJson = require('./write-json');

const CWD = process.cwd();

function filterDependencies(dependencies, test) {
  return Object.keys(dependencies)
  .filter(test)
  .reduce((obj, key) => {
    obj[key] = dependencies[key];
    return obj;
  }, {});
}

async function modifyDependencies(packageJson, ejectedPackageJson, section) {
  packageJson[section] = packageJson[section] || {};
  ejectedPackageJson[section] = ejectedPackageJson[section] || {};

  const nonSkyuxSdkDependencies = filterDependencies(
    packageJson[section],
    key => key.indexOf('@skyux-sdk/') === -1
  );

  const skyuxDependencies = filterDependencies(
    nonSkyuxSdkDependencies,
    key => /^(@skyux|@blackbaud|@blackbaud-internal)\//.test(key)
  );

  await appDependencies.upgradeDependencies(skyuxDependencies);

  const merged = Object.assign({}, nonSkyuxSdkDependencies, skyuxDependencies, ejectedPackageJson[section]);
  ejectedPackageJson[section] = merged;
}

/**
 * Moves (and upgrades) any SKY UX dependencies to the new Angular CLI package.json file.
 */
 async function modifyPackageJson(ejectedProjectPath) {
  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  const ejectedPackageJson = fs.readJsonSync(path.join(ejectedProjectPath, 'package.json'));

  await modifyDependencies(packageJson, ejectedPackageJson, 'dependencies');
  await modifyDependencies(packageJson, ejectedPackageJson, 'devDependencies');

  writeJson(
    path.join(ejectedProjectPath, 'package.json'),
    ejectedPackageJson
  );

  // Install the new packages.
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

module.exports = modifyPackageJson;
