const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const commentJson = require('comment-json');

const getBuildToolMetadata = require('./utils/get-build-tool-metadata');

const CWD = process.cwd();

const REQUIRED_BUILD_TARGET = 'es5';

const REQUIRED_BROWSER_LIST = [
  'last 1 Chrome version',
  'last 1 Firefox version',
  'last 2 Edge major versions',
  'last 2 Safari major versions',
  'last 2 iOS major versions',
  'Firefox ESR',
  'IE 11'
];

const REQUIRED_BUILDER = '@blackbaud-internal/skyux-angular-builders';

function readJson(file) {
  const contents = fs.readFileSync(file).toString();
  return commentJson.parse(contents);
}

// function validatePackageJson() {}

function validateTsConfigs() {
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

function validateBrowserListRc() {
  const browserListFile = '.browserslistrc';
  const contents = fs.readFileSync(path.join(CWD, browserListFile)).toString();

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

function validateAngularJson() {
  const angularJson = readJson(path.join(CWD, 'angular.json'));

  for (const projectName in angularJson.projects) {
    const project = angularJson.projects[projectName];
    switch (project.projectType) {
      case 'application':
        for (const architect of ['build', 'serve', 'test']) {
          const builderName = project.architect[architect].builder;
          if (!builderName.startsWith(REQUIRED_BUILDER)) {
            throw new Error(`The "projects/${projectName}/architect/${architect}/builder" node in angular.json specifies an unsupported builder "${builderName}". A builder from the "${REQUIRED_BUILDER}" package is required.`);
          }
        }
        break;
      case 'library':
        // for (const architect of ['test']) {

        // }
        break;
    }
  }
}

async function checkWorkspace() {
  try {
    logger.info('Checking workspace for invalid configurations...');

    const buildTool = await getBuildToolMetadata();
    if (buildTool.name === '@skyux-sdk/builder') {
      logger.warn(
        'The `check-workspace` command is not available for `@skyux-sdk/builder` projects. Skipping.'
      );
      return;
    }

    validateTsConfigs();
    validateBrowserListRc();
    validateAngularJson();

    logger.info('Workspace is OK.');

  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
