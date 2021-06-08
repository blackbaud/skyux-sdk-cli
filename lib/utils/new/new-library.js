const logger = require('@blackbaud/skyux-logger');

const createAngularLibrary = require('../eject/libraries/create-angular-library');
const createAngularWorkspace = require('../eject/libraries/create-angular-workspace');
const modifyRootReadme = require('../eject/libraries/modify-root-readme');
const modifyGitignore = require('../eject/modify-gitignore');

async function newLibrary(projectPath, projectName, packageName) {
  logger.info('Creating an Angular CLI library (this might take several minutes)...');

  // Create Angular workspace and library template.
  createAngularWorkspace(projectPath, `${projectName}-workspace`, true);
  createAngularLibrary(projectPath, projectName);

  // Copy/modify source files.
  modifyRootReadme(projectPath, projectName, packageName);
  modifyGitignore(projectPath, [
    '/screenshots-baseline-local',
    '/screenshots-diff-local'
  ]);
}

module.exports = newLibrary;
