const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

const npmInstall = require('../npm-install');

const copyFiles = require('./libraries/copy-files');
const createAngularLibrary = require('./libraries/create-angular-library');
const createAngularWorkspace = require('./libraries/create-angular-workspace');
const modifyLibraryPackageJson = require('./libraries/modify-library-package-json');
const modifyRootReadme = require('./libraries/modify-root-readme');

const backupSourceFiles = require('./backup-source-files');
const constants = require('./constants');
const installAngularBuilders = require('./install-angular-builders');
const migrateSkyuxConfigFiles = require('./migrate-skyux-config-files');
const modifyGitignore = require('./modify-gitignore');
const modifyWorkspacePackageJson = require('./modify-package-json');
const moveEjectedFilesToCwd = require('./move-ejected-files');

function getLibraryMetadata() {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  return {
    projectName: packageJson.name.replace(/(^@.*\/)?/, ''),
    packageName: packageJson.name
  };
}

async function ejectLibrary(
  librarySourcePath,
  ejectedProjectPath,
  isInternal,
  strictMode
) {
  logger.info('Ejecting an Angular CLI library (this might take several minutes)...');

  const { projectName, packageName } = getLibraryMetadata();

  backupSourceFiles(ejectedProjectPath, constants.SOURCE_CODE_BACKUP_DIR);

  // Create Angular workspace and library template.
  createAngularWorkspace(ejectedProjectPath, `${projectName}-workspace`, strictMode);
  createAngularLibrary(ejectedProjectPath, projectName);

  // Copy/modify source files.
  migrateSkyuxConfigFiles(ejectedProjectPath, isInternal);
  copyFiles.copySourceFiles(librarySourcePath, ejectedProjectPath, projectName);
  copyFiles.copyRootFiles(ejectedProjectPath, projectName);
  modifyRootReadme(ejectedProjectPath, projectName, packageName);
  modifyLibraryPackageJson(ejectedProjectPath, projectName);
  modifyGitignore(ejectedProjectPath, [
    constants.SOURCE_CODE_BACKUP_DIR,
    '/screenshots-baseline-local',
    '/screenshots-diff-local'
  ]);

  installAngularBuilders(ejectedProjectPath, isInternal);

  await modifyWorkspacePackageJson(ejectedProjectPath);

  moveEjectedFilesToCwd(ejectedProjectPath);

  await npmInstall();

  logger.info('Done ejecting library.');
}

module.exports = ejectLibrary;
