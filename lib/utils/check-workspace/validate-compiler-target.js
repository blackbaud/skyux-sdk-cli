const lodashGet = require('lodash.get');
const path = require('path');

const { readJsonC } = require('../jsonc-utils');

const { REQUIRED_COMPILER_TARGET } = require('./constants');

const CWD = process.cwd();

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
  const tsConfigPath = getProductionTsConfigPath(project);
  const target = getTsConfigTarget(tsConfigPath);

  if (!target) {
    workspaceState.addFailed(
      `A value for "target" was not defined in the "${tsConfigPath.replace(CWD, '')}" file. ` +
        `A compile target of "${REQUIRED_COMPILER_TARGET}" is required.`
    );
    return;
  }

  if (target.toLocaleUpperCase() !== REQUIRED_COMPILER_TARGET.toLocaleUpperCase()) {
    workspaceState.addFailed(
      `The "${tsConfigPath.replace(CWD, '')}" file specifies an invalid compile target of "${target}". ` +
        `A compiler target of "${REQUIRED_COMPILER_TARGET}" is required.`
    );
    return;
  }

  workspaceState.addPassed(
    `The TypeScript compiler target is set to "${target}".`
  );
}

module.exports = validateCompilerTarget;
