const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

const npmInstall = require('../npm-install');

const copySourceFiles = require('./libraries/copy-source-files');
const createAngularLibrary = require('./libraries/create-angular-library');
const createAngularWorkspace = require('./libraries/create-angular-workspace');
const modifyLibraryPackageJson = require('./libraries/modify-library-package-json');

const backupSourceFiles = require('./backup-source-files');
const constants = require('./constants');
const installAngularBuilders = require('./install-angular-builders');
const migrateSkyuxConfigFiles = require('./migrate-skyux-config-files');
const modifyGitignore = require('./modify-gitignore');
const modifyWorkspacePackageJson = require('./modify-package-json');
const moveEjectedFilesToCwd = require('./move-ejected-files');


function getLibraryName() {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  return packageJson.name.replace(/(^@.*\/)?/, '');
}

async function ejectLibrary(
  librarySourcePath,
  ejectedProjectPath,
  isInternal,
  strictMode
) {
  logger.info('Ejecting an Angular CLI library (this might take several minutes)...');

  const libraryName = getLibraryName();

  backupSourceFiles(ejectedProjectPath, constants.SOURCE_CODE_BACKUP_DIR);

  createAngularWorkspace(ejectedProjectPath, `${libraryName}-workspace`, strictMode);
  createAngularLibrary(ejectedProjectPath, libraryName);

  // Copy/modify source files.
  migrateSkyuxConfigFiles(ejectedProjectPath, isInternal);
  copySourceFiles(librarySourcePath, ejectedProjectPath, libraryName);
  modifyGitignore(ejectedProjectPath, [
    constants.SOURCE_CODE_BACKUP_DIR,
    '/screenshots-baseline-local',
    '/screenshots-diff-local'
  ]);

  modifyLibraryPackageJson(ejectedProjectPath, libraryName);

  installAngularBuilders(ejectedProjectPath, isInternal);

  await modifyWorkspacePackageJson(ejectedProjectPath);

  moveEjectedFilesToCwd(ejectedProjectPath);

  await npmInstall();

  logger.info('Done ejecting library.');
}

module.exports = ejectLibrary;
