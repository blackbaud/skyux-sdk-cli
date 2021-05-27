const logger = require('@blackbaud/skyux-logger');
const commentJson = require('comment-json');
const fs = require('fs-extra');
const glob = require('glob');
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

function readJson(file) {
  const contents = fs.readFileSync(file).toString();
  return commentJson.parse(contents);
}

/**
 * Validates the project's tsconfig.json files and confirms
 * required properties are set correctly.
 */
function validateTsConfigs(isLibrary) {
  if (isLibrary) {
    logger.verbose(
      'Angular "projects" directory detected. ' +
        'Skipping tsconfig build target validation.'
    );
    return;
  }

  const files = glob.sync(path.join(CWD, 'tsconfig?(*).json'));

  files.forEach((file) => {
    const tsConfig = readJson(path.join(file));
    const target = (tsConfig.compilerOptions.target || '').toLocaleUpperCase();
    if (target && target !== REQUIRED_BUILD_TARGET.toLocaleUpperCase()) {
      throw new Error(
        `The "${path.basename(file)}" file specifies an invalid target of "${tsConfig.compilerOptions.target}". ` +
          `Legacy browsers require a build target of "${REQUIRED_BUILD_TARGET}".`
      );
    }
  });
}

/**
 * Verifies that our list of supported browsers is included
 * in the project's .browserslistrc file.
 *
 */
function validateBrowserListRc(isLibrary) {
  if (isLibrary) {
    logger.verbose(
      'Angular "projects" directory detected. ' +
        'Skipping browser list validation.'
    );
    return;
  }

  const browserListFile = '.browserslistrc';
  const browserslistrcPath = path.join(CWD, browserListFile);

  if (!fs.existsSync(browserslistrcPath)) {
    throw new Error('Expected file ".browserslistrc" to exist but it was not found.');
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
      `The "${browserListFile}" file is missing the following required browser definition(s):` +
        `\n---\n` +
        `${missingBrowsers.join('\n')}.` +
        `\n---\n`
    );
  }
}

/**
 * Verifies that our builder is being used for the given architect.
 */
function validateArchitect(architect, project, projectName, buildToolPackageName) {
  const builderName = project.architect[architect].builder;
  if (!builderName.startsWith(`${buildToolPackageName}:`)) {
    throw new Error(
      `The "projects/${projectName}/architect/${architect}/builder" node in angular.json ` +
        `specifies an unsupported builder "${builderName}". A builder from the ` +
        `"${buildToolPackageName}" package is required.`
    );
  }
}

/**
 * Validates the project's angular.json file and confirms
 * required properties are set correctly.
 */
function validateAngularJson(buildToolPackageName) {
  const angularJson = readJson(path.join(CWD, 'angular.json'));

  for (const projectName in angularJson.projects) {
    const project = angularJson.projects[projectName];
    const outputHashing = project.architect.build && project.architect.build.configurations.production.outputHashing;

    switch (project.projectType) {
      case 'application':
      default:
        for (const architect of ['build', 'serve', 'test']) {
          validateArchitect(architect, project, projectName, buildToolPackageName);
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
        validateArchitect('test', project, projectName, buildToolPackageName);
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
}

async function checkWorkspace() {
  try {
    logger.info('Checking workspace for invalid configurations...');

    const buildTool = await getBuildToolMetadata();
    if (buildTool.name === '@skyux-sdk/builder') {
      logger.warn(
        'The `check-workspace` command is not available for ' +
          '`@skyux-sdk/builder` projects. Skipping.'
      );
      return;
    }

    const isLibrary = fs.existsSync(path.join(CWD, 'projects'));

    validateTsConfigs(isLibrary);
    validateBrowserListRc(isLibrary);
    validateAngularJson(buildTool.name);
    validatePackageLock();

    logger.info('Workspace is OK.');

  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
