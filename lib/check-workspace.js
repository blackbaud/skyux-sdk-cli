const logger = require('@blackbaud/skyux-logger');
const path = require('path');

const getBuildToolMetadata = require('./utils/get-build-tool-metadata');
const validateAngularJson = require('./utils/check-workspace/validate-angular-json');
const validateBrowserslistrc = require('./utils/check-workspace/validate-browserslistrc');
const validateCompilerTarget = require('./utils/check-workspace/validate-compiler-target');
const validatePackageLock = require('./utils/check-workspace/validate-package-lock');

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

async function checkWorkspace(argv = {}) {
  try {
    const requiredProjectType = argv.projectType || 'application';

    logger.info(`Checking ${requiredProjectType} workspace configuration...`);

    const buildTool = await getBuildToolMetadata();
    if (buildTool.name === '@skyux-sdk/builder') {
      logger.warn(
        'The `check-workspace` command is not available for ' +
          '`@skyux-sdk/builder` projects. Skipping.'
      );
      return;
    }

    // Make sure the default project listed in angular.json is of the required type.
    const project = getDefaultProjectMetadata();
    if (project.projectDefinition.projectType !== requiredProjectType) {
      throw new Error(
        `The default project "${project.projectName}" defined in angular.json is of ` +
          `type "${project.projectDefinition.projectType}" but a project type of ` +
          `"${requiredProjectType}" is required.`
      );
    }

    validateCompilerTarget(project);
    validateBrowserslistrc(project);
    validateAngularJson(buildTool);
    validatePackageLock();

    logger.info('Workspace is OK.');

  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
