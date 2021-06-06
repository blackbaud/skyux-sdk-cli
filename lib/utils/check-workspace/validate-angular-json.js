const lodashGet = require('lodash.get');
const path = require('path');

const { readJsonC } = require('../jsonc-utils');

const CWD = process.cwd();

function getAngularJson() {
  return readJsonC(path.join(CWD, 'angular.json'));
}

/**
 * Verifies that our builder is being used for
 * the given target in angular.json.
 */
 function validateAngularTarget(
  targetName,
  projectDefinition,
  projectName,
  buildTool,
  workspaceState
) {
  const builderName = projectDefinition.architect[targetName].builder;
  if (!builderName.startsWith(`${buildTool.name}:`)) {
    workspaceState.addFailed(
      `The "projects/${projectName}/architect/${targetName}/builder" node in angular.json ` +
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
function validateAngularJson(buildTool, workspaceState) {
  const angularJson = getAngularJson();

  for (const projectName in angularJson.projects) {
    const projectDefinition = angularJson.projects[projectName];
    const outputHashing = lodashGet(
      projectDefinition,
      'architect.build.configurations.production.outputHashing'
    );

    switch (projectDefinition.projectType) {
      case 'application':
      default:
        for (const target of ['build', 'serve', 'test']) {
          validateAngularTarget(
            target,
            projectDefinition,
            projectName,
            buildTool,
            workspaceState
          );
        }

        // Output hashing needs to be set to "bundles" (and not "all")
        // to allow our custom assets hash utility to process assets in SCSS files.
        if (outputHashing !== 'bundles') {
          if (!outputHashing) {
            workspaceState.addFailed(
              `The "projects/${projectName}/architect/build/configurations/production/outputHashing" node ` +
                `in angular.json is not defined but a value of "bundles" is required.`
            );
          } else {
            workspaceState.addFailed(
              `The "projects/${projectName}/architect/build/configurations/production/outputHashing" node ` +
                `in angular.json is set to "${outputHashing}" but a value of "bundles" is required.`
            );
          }
        }
        break;

      case 'library':
        workspaceState.addFailed(
          validateAngularTarget(
            'test',
            projectDefinition,
            projectName,
            buildTool,
            workspaceState
          )
        );
        break;
    }
  }
}

module.exports = validateAngularJson;
