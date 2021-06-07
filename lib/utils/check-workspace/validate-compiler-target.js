const logger = require('@blackbaud/skyux-logger');
const lodashGet = require('lodash.get');
const path = require('path');

const { readJsonC } = require('../jsonc-utils');

const CWD = process.cwd();

// The es5 build target is required to support IE 11.
const REQUIRED_BUILD_TARGET = 'es5';

function getProductionTsConfigPath(project) {
  const productionTsConfig = lodashGet(
    project,
    'projectDefinition.architect.build.options.tsConfig'
  );

  if (!productionTsConfig) {
    throw new Error(
      `The "projects/${project.projectName}/architect/build/options/tsConfig" ` +
        'node in angular.json is not defined.'
    );
  }

  return path.join(CWD, productionTsConfig);
}

function getTsConfigTarget(tsConfigPath) {
  const tsConfig = readJsonC(path.join(tsConfigPath));

  const target = lodashGet(tsConfig, 'compilerOptions.target');
  if (target) {
    return target;
  }

  // Check the tsconfig file listed in the "extends" property.
  if (tsConfig.extends) {
    return getTsConfigTarget(path.join(CWD, tsConfig.extends));
  }

  return null;
}

/**
 * Validates the project's production tsconfig.json file and confirms
 * required properties are set correctly.
 */
function validateCompilerTarget(project, workspaceState) {
  if (project.projectDefinition.projectType === 'library') {
    logger.verbose(
      'Angular library project detected. ' +
        'Skipping tsconfig build target validation.'
    );
    return;
  }

  const tsConfigPath = getProductionTsConfigPath(project);
  const target = getTsConfigTarget(tsConfigPath);

  if (!target) {
    workspaceState.addFailed(
      `A value for "target" was not defined in the "${tsConfigPath.replace(CWD, '')}" file. ` +
        `A compile target of "${REQUIRED_BUILD_TARGET}" is required.`
    );
    return;
  }

  if (target.toLocaleUpperCase() !== REQUIRED_BUILD_TARGET.toLocaleUpperCase()) {
    workspaceState.addFailed(
      `The "${tsConfigPath.replace(CWD, '')}" file specifies an invalid compile target of "${target}". ` +
        `A compiler target of "${REQUIRED_BUILD_TARGET}" is required.`
    );
    return;
  }

  workspaceState.addPassed(
    `The TypeScript compiler target is set to "${target}".`
  );
}

module.exports = validateCompilerTarget;
