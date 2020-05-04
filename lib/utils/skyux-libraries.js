const fs = require('fs-extra');

/**
 * Checks the entry point of a component library.
 */
async function fixEntryPoints() {
  const isLibrary = await fs.pathExists('src/app/public/index.ts');
  if (!isLibrary) {
    return;
  }

  // Remove root-level index file because it is not needed anymore.
  await fs.remove('index.ts');

  // Rename the library index file to what ng-packagr recommends.
  await fs.copyFile('src/app/public/index.ts', 'src/app/public/public_api.ts');

  // Rename the testing module index file.
  const hasTestingModule = await fs.pathExists('src/app/public/testing/index.ts');
  if (hasTestingModule) {
    await fs.copyFile('src/app/public/testing/index.ts', 'src/app/public/testing/public_api.ts');
  }
}

function validatePackageJson(packageJson) {
  // Remove `module` and `main` since ng-packagr handles these values.
  delete packageJson.main;
  delete packageJson.module;
  return packageJson;
}

module.exports = {
  fixEntryPoints,
  validatePackageJson
};