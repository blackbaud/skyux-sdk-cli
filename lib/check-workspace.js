const logger = require('@blackbaud/skyux-logger');
const path = require('path');

const validateAngularJson = require('./utils/check-workspace/validate-angular-json');
const validateBrowserslistrc = require('./utils/check-workspace/validate-browserslistrc');
const validateCompilerTarget = require('./utils/check-workspace/validate-compiler-target');
const validatePackageLock = require('./utils/check-workspace/validate-package-lock');
const createWorkspaceState = require('./utils/check-workspace/create-workspace-state');

const getBuildToolMetadata = require('./utils/get-build-tool-metadata');
const { readJsonC } = require('./utils/jsonc-utils');

const CWD = process.cwd();

function getAngularJson() {
  return readJsonC(path.join(CWD, 'angular.json'));
}

function getDefaultProjectMetadata() {
  const angularJson = getAngularJson();

  const projectName = angularJson.defaultProject;
  if (!projectName) {
    throw new Error(
      'A default project was not defined in "angular.json".'
    );
  }

  return {
    projectName,
    projectDefinition: angularJson.projects[projectName]
  };
}

function notifyStatus(workspaceState) {
  let failed = false;
  for (const message of workspaceState.allStatusMessages()) {
    if (message.status === 'failed') {
      failed = true;
      logger.error(` ✘ FAILED  ${message.message}`);
    } else {
      logger.info(` ✔ PASSED  ${message.message} OK.`);
    }
  }

  if (failed) {
    throw new Error('Workspace did not pass validation checks.');
  } else {
    logger.info('Workspace is OK.');
  }
}

async function checkWorkspace(argv = {}) {
  try {
    const requiredProjectType = argv.projectType || 'application';

    logger.info(`Checking ${requiredProjectType} workspace configuration...`);

    const buildTool = await getBuildToolMetadata();
    if (!buildTool || buildTool.name === '@skyux-sdk/builder') {
      logger.warn(
        'The `check-workspace` command is only available for ' +
          'Angular CLI projects. Skipping.'
      );
      return;
    }

    const workspaceState = createWorkspaceState();

    // Make sure the default project listed in angular.json is of the required type.
    const project = getDefaultProjectMetadata();
    const projectType = project.projectDefinition.projectType;

    if (projectType !== requiredProjectType) {
      throw new Error(
        `The default project "${project.projectName}" defined in angular.json is of ` +
          `type "${project.projectDefinition.projectType}" but a project type of ` +
          `"${requiredProjectType}" is required.`
      );
    }

    // Run the following checks for both applications and libraries.
    validateAngularJson(project, buildTool, workspaceState);
    validatePackageLock(workspaceState);

    // Only run the following checks for applications.
    if (projectType === 'application') {
      validateCompilerTarget(project, workspaceState);
      validateBrowserslistrc(project, workspaceState);
    }

    notifyStatus(workspaceState);

  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
