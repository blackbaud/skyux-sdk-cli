const logger = require('@blackbaud/skyux-logger');
const commentJson = require('comment-json');
const fs = require('fs-extra');
const lodashGet = require('lodash.get');
const path = require('path');

const getBuildToolMetadata = require('./utils/get-build-tool-metadata');

const CWD = process.cwd();

// The es5 build target is required to support IE 11.
const REQUIRED_BUILD_TARGET = 'es5';

// These are the browser definitions that are generated when
// running `ng new --legacy-browsers`.
const REQUIRED_BROWSER_LIST = [
  'last 1 Chrome version',
  'last 1 Firefox version',
  'last 2 Edge major versions',
  'last 2 Safari major versions',
  'last 2 iOS major versions',
  'Firefox ESR',
  'IE 11'
];

/**
 * Reads and parses JSON files.
 * Handles files that include comment blocks.
 */
function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`File "${file}" not found or is unreadable.`);
  }

  const contents = fs.readFileSync(file).toString();
  return commentJson.parse(contents);
}

function getAngularJson() {
  return readJson(path.join(CWD, 'angular.json'));
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

function getProductionTsConfigPath(project) {
  const productionTsConfig = lodashGet(project, 'projectDefinition.architect.build.options.tsConfig');
  if (!productionTsConfig) {
    throw new Error(
      `The "projects/${project.projectName}/architect/build/options/tsConfig" node in angular.json is not defined.`
    );
  }

  return path.join(CWD, productionTsConfig);
}

function getTsConfigTarget(tsConfigPath) {
  const tsConfig = readJson(path.join(tsConfigPath));

  const target = lodashGet(tsConfig, 'compilerOptions.target');
  if (target) {
    return target.toLocaleUpperCase();
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
function validateCompilerTarget(project) {
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
    throw new Error(
      `A value for "target" was not defined in the "${tsConfigPath}" file. ` +
        `A compile target of "${REQUIRED_BUILD_TARGET}" is required.`
    );
  }

  if (target !== REQUIRED_BUILD_TARGET.toLocaleUpperCase()) {
    throw new Error(
      `The "${tsConfigPath}" file specifies an invalid compile target of "${target}". ` +
        `A compiler target of "${REQUIRED_BUILD_TARGET}" is required.`
    );
  }

  logger.info(`✓ The TypeScript compiler target is set to "${target}". OK.`);
}

/**
 * Verifies that our list of supported browsers is included
 * in the project's .browserslistrc file.
 *
 */
function validateBrowserslistrc(project) {
  if (project.projectDefinition.projectType === 'library') {
    logger.verbose(
      'Angular library project detected. ' +
        'Skipping browser list validation.'
    );
    return;
  }

  const browserListFile = '.browserslistrc';
  const browserslistrcPath = path.join(CWD, browserListFile);

  if (!fs.existsSync(browserslistrcPath)) {
    throw new Error(
      'Expected file ".browserslistrc" to exist but it was not found.'
    );
  }

  const contents = fs.readFileSync(browserslistrcPath).toString();

  const missingBrowsers = [];
  for (const browser of REQUIRED_BROWSER_LIST) {
    if (!contents.includes(browser)) {
      missingBrowsers.push(browser);
    }
  }

  if (missingBrowsers.length > 0) {
    throw new Error(
      `The "${browserListFile}" file is missing the following required ` +
        'browser definition(s):' +
        `\n---\n` +
        `${missingBrowsers.join('\n')}.` +
        `\n---\n`
    );
  }

  logger.info('✓ The .browserslistrc file includes all supported browsers. OK.');
}

/**
 * Verifies that our builder is being used for the given target in angular.json.
 */
function validateAngularTarget(
  targetName,
  projectDefinition,
  projectName,
  buildTool
) {
  const builderName = projectDefinition.architect[targetName].builder;
  if (!builderName.startsWith(`${buildTool.name}:`)) {
    throw new Error(
      `The "projects/${projectName}/architect/${targetName}/builder" node in angular.json ` +
        `specifies an unsupported builder "${builderName}". A builder from the ` +
        `"${buildTool.name}" package is required.`
    );
  }

  logger.info(`✓ The "${targetName}" target in angular.json specifies "${builderName}". OK.`);
}

/**
 * Validates the project's angular.json file and confirms
 * required properties are set correctly.
 */
function validateAngularJson(buildTool) {
  const angularJson = getAngularJson();

  for (const projectName in angularJson.projects) {
    const projectDefinition = angularJson.projects[projectName];
    const outputHashing = lodashGet(projectDefinition, 'architect.build.configurations.production.outputHashing');

    switch (projectDefinition.projectType) {
      case 'application':
      default:
        for (const target of ['build', 'serve', 'test']) {
          validateAngularTarget(
            target,
            projectDefinition,
            projectName,
            buildTool
          );
        }

        // Output hashing needs to be set to "bundles" (and not "all")
        // to allow our custom assets hash utility to process assets in SCSS files.
        if (outputHashing !== 'bundles') {
          throw new Error(
            `The "projects/${projectName}/architect/build/configurations/production/outputHashing" node ` +
              `in angular.json is set to "${outputHashing}" but a value of "bundles" is required.`
          );
        }
        break;

      case 'library':
        validateAngularTarget(
          'test',
          projectDefinition,
          projectName,
          buildTool
        );
        break;
    }
  }
}

/**
 * Checks if the project includes a package-lock.json file.
 * We check for the existence of the lock file to avoid transitive
 * dependencies and to foster build-to-build consistency.
 */
function validatePackageLock() {
  if (!fs.existsSync(path.join(CWD, 'package-lock.json'))) {
    throw new Error(
      'A valid package-lock.json file was not found. Run `npm install` ' +
        'to generate a new package-lock.json file and confirm it is ' +
        'not listed in your project\'s .gitignore file.'
    );
  }

  logger.info('✓ A valid package-lock.json file exists. OK.')
}

async function checkWorkspace(argv = {}) {
  try {
    const requiredProjectType = argv.projectType || 'application';

    logger.info(`Checking ${requiredProjectType} configuration...`);

    const buildTool = await getBuildToolMetadata();
    if (buildTool.name === '@skyux-sdk/builder') {
      logger.warn(
        'The `check-workspace` command is not available for ' +
          '`@skyux-sdk/builder` projects. Skipping.'
      );
      return;
    }

    const project = getDefaultProjectMetadata();
    if (project.projectDefinition.projectType !== requiredProjectType) {
      throw new Error(
        `The default project "${project.projectName}" defined in angular.json is of type "${project.projectDefinition.projectType}" but a project type of "${requiredProjectType}" is required.`
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
