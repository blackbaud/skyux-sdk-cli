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

/**
 * Moves (and upgrades) any SKY UX dependencies to the new Angular CLI package.json file.
 */
 async function modifyPackageJson(ejectedProjectPath) {
  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  const ejectedPackageJson = fs.readJsonSync(path.join(ejectedProjectPath, 'package.json'));

  packageJson.dependencies = packageJson.dependencies || {};
  ejectedPackageJson.dependencies = ejectedPackageJson.dependencies || {};

  const nonSkyuxSdkDependencies = filterDependencies(
    packageJson.dependencies,
    key => key.indexOf('@skyux-sdk/') === -1
  );

  const skyuxDependencies = filterDependencies(
    nonSkyuxSdkDependencies,
    key => /^(@skyux|@blackbaud|@blackbaud-internal)\//.test(key)
  );

  await appDependencies.upgradeDependencies(skyuxDependencies);

  const merged = Object.assign({}, nonSkyuxSdkDependencies, skyuxDependencies, ejectedPackageJson.dependencies);
  ejectedPackageJson.dependencies = merged;

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
