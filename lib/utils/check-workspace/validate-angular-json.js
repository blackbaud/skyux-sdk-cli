const lodashGet = require('lodash.get');
const { REQUIRED_OUTPUT_HASHING_VALUE } = require('./constants');

/**
 * Verifies that our builder is being used for the given target in angular.json.
 */
function checkTargetBuilderValue(
  targetName,
  project,
  buildTool,
  workspaceState
) {
  const builderName = lodashGet(
    project,
    `projectDefinition.architect.${targetName}.builder`
  );

  if (!builderName.startsWith(`${buildTool.name}:`)) {
    workspaceState.addFailed(
      `The "projects/${project.projectName}/architect/${targetName}/builder" node in angular.json ` +
        `specifies an unsupported builder "${builderName}". A builder from the ` +
        `"${buildTool.name}" package is required.`
    );
    return;
  }

  workspaceState.addPassed(
    `The "${targetName}" target in angular.json specifies the builder "${builderName}".`
  );
}

/**
 * Validates the project's angular.json file and confirms
 * required properties are set correctly.
 */
function validateAngularJson(project, buildTool, workspaceState) {
  const outputHashing = lodashGet(
    project.projectDefinition,
    'architect.build.configurations.production.outputHashing'
  );

  switch (project.projectDefinition.projectType) {
    case 'application':
      for (const target of ['build', 'serve', 'test']) {
        checkTargetBuilderValue(
          target,
          project,
          buildTool,
          workspaceState
        );
      }

      if (outputHashing !== REQUIRED_OUTPUT_HASHING_VALUE) {
        const nodePath = `projects/${project.projectName}/architect/build/configurations/production/outputHashing`;

        if (!outputHashing) {
          workspaceState.addFailed(
            `The "${nodePath}" node in angular.json is not defined but a value of "${REQUIRED_OUTPUT_HASHING_VALUE}" is required.`
          );
        } else {
          workspaceState.addFailed(
            `The "${nodePath}" node in angular.json is set to "${outputHashing}" but a value of "${REQUIRED_OUTPUT_HASHING_VALUE}" is required.`
          );
        }
      }
      break;

    case 'library':
      checkTargetBuilderValue(
        'test',
        project,
        buildTool,
        workspaceState
      );
      break;
  }
}

module.exports = validateAngularJson;
