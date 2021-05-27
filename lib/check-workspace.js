const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');
const commentJson = require('comment-json');

const cliVersion = require('./utils/cli-version');
const getBuildToolMetadata = require('./utils/get-build-tool-metadata');

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

// function validatePackageJson() {}

function validateTsConfigs() {
  const files = glob.sync('tsconfig?(*).json');

  files.forEach((file) => {
    const tsConfigContents = fs.readFileSync(path.join(file)).toString();
    const tsConfig = commentJson.parse(tsConfigContents);
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
  const contents = fs.readFileSync(path.join(process.cwd(), browserListFile)).toString();
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

// function validateAngularJson() {}

async function checkWorkspace() {
  try {
    logger.info('Checking workspace for invalid configurations...');

    await cliVersion.verifyLatestVersion();

    const buildTool = await getBuildToolMetadata();
    if (buildTool.name === '@skyux-sdk/builder') {
      logger.warn('The `check-workspace` command is not available for `@skyux-sdk/builder` projects.');
      return;
    }

    validateTsConfigs();
    validateBrowserListRc();

    logger.info('Workspace is OK.');

  } catch (err) {
    logger.error(`[skyux check-workspace] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = checkWorkspace;
