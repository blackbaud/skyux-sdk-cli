const logger = require('@blackbaud/skyux-logger');
const crossSpawn = require('cross-spawn');
const fs = require('fs-extra');
const path = require('path');

const npmInstall = require('../npm-install');

const addSkyUxAngularBuilder = require('./add-angular-builder');
const backupSourceFiles = require('./backup-source-files');
const constants = require('./constants');
const migrateSkyuxConfigFiles = require('./migrate-skyux-config-files');
const modifyGitignore = require('./modify-gitignore');
const modifyWorkspacePackageJson = require('./modify-package-json');
const moveEjectedFilesToCwd = require('./move-ejected-files');

function createAngularWorkspace(ejectedProjectPath, workspaceName, enableStrictMode = false) {
  const ejectedProjectDir = path.basename(ejectedProjectPath);

  logger.info(`Creating an empty Angular workspace named "${workspaceName}", located at "./${ejectedProjectDir}"...`);

  const args = [
    'new', workspaceName,
    '--create-application=false',
    `--directory=${ejectedProjectDir}`,
    `--strict=${enableStrictMode ? 'true' : 'false'}`
  ];

  crossSpawn.sync('ng', args, {
    stdio: 'inherit'
  });

  logger.info('Done.');
}

function createAngularLibrary(ejectedProjectPath, projectName) {
  logger.info(`Creating an Angular CLI library project named "${projectName}"...`);

  crossSpawn.sync('ng', [
    'generate', 'library', projectName,
    '--prefix=sky'
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

function copySourceFiles(sourcePath, ejectedProjectPath, projectDirectory) {
  logger.info('Copying library source files...');

  const copyDestinationRoot = path.join(ejectedProjectPath, `projects/${projectDirectory}/src`);

  // Delete some of the template files Angular generated.
  fs.removeSync(path.join(copyDestinationRoot, 'lib'));
  fs.removeSync(path.join(copyDestinationRoot, 'public-api.ts'));

  // Copy source files.
  fs.copySync(sourcePath, copyDestinationRoot);

  // Rename the `public_api.ts` file to what Angular recommends.
  fs.renameSync(
    path.join(copyDestinationRoot, 'public_api.ts'),
    path.join(copyDestinationRoot, 'public-api.ts')
  );

  logger.info('Done.');
}

function getPackageJson() {
  return fs.readJsonSync(path.join(process.cwd(), 'package.json'));
}

function getLibraryName() {
  const packageJson = getPackageJson();
  return packageJson.name.replace(/(^@.*\/)?/, '');
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

async function ejectLibrary(
  librarySourcePath,
  ejectedProjectPath,
  isInternal,
  enableStrictMode
) {
  logger.info('Ejecting an Angular CLI library (this might take several minutes)...');

  const libraryName = getLibraryName();

  backupSourceFiles(ejectedProjectPath, constants.SOURCE_CODE_BACKUP_DIR);

  createAngularWorkspace(ejectedProjectPath, `${libraryName}-workspace`, enableStrictMode);
  createAngularLibrary(ejectedProjectPath, libraryName);

  migrateSkyuxConfigFiles(ejectedProjectPath, isInternal);
  copySourceFiles(librarySourcePath, ejectedProjectPath, libraryName);

  modifyPackageJson(ejectedProjectPath, libraryName);
  modifyGitignore(ejectedProjectPath, [
    constants.SOURCE_CODE_BACKUP_DIR,
    '/screenshots-baseline-local',
    '/screenshots-diff-local'
  ]);

  addSkyUxAngularBuilder(ejectedProjectPath, isInternal);

  await modifyWorkspacePackageJson(ejectedProjectPath);

  moveEjectedFilesToCwd(ejectedProjectPath);

  await npmInstall();

  logger.info('Done ejecting library.');
}

module.exports = ejectLibrary;
