const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

const npmInstall = require('../npm-install');

const copyFiles = require('./libraries/copy-files');
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
const runLintFix = require('./run-lint-fix');


function getLibraryMetadata() {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  return {
    libraryName: packageJson.name.replace(/(^@.*\/)?/, ''),
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

  const { libraryName, packageName } = getLibraryMetadata();

  backupSourceFiles(ejectedProjectPath, constants.SOURCE_CODE_BACKUP_DIR);

  // Create Angular workspace and library template.
  createAngularWorkspace(ejectedProjectPath, `${libraryName}-workspace`, strictMode);
  createAngularLibrary(ejectedProjectPath, libraryName);

  // Copy/modify source files.
  migrateSkyuxConfigFiles(ejectedProjectPath, isInternal);
  copyFiles.copySourceFiles(librarySourcePath, ejectedProjectPath, libraryName);
  copyFiles.copyRootFiles(ejectedProjectPath, libraryName, packageName);
  modifyLibraryPackageJson(ejectedProjectPath, libraryName);
  modifyGitignore(ejectedProjectPath, [
    constants.SOURCE_CODE_BACKUP_DIR,
    '/screenshots-baseline-local',
    '/screenshots-diff-local'
  ]);

  // // Remove the generated library's README file.
  // // (The one at the root should be used).
  // const contents = fs.readFileSync(path.join(ejectedProjectPath, 'README.md'));

  installAngularBuilders(ejectedProjectPath, isInternal);

  await modifyWorkspacePackageJson(ejectedProjectPath);

  moveEjectedFilesToCwd(ejectedProjectPath);

  await npmInstall();

  runLintFix(ejectedProjectPath);

  logger.info('Done ejecting library.');
}

module.exports = ejectLibrary;
