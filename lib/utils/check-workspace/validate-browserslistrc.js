const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

const CWD = process.cwd();

// These browser definitions are generated when running `ng new --legacy-browsers`.
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
 * Verifies that our list of supported browsers is included
 * in the project's .browserslistrc file.
 */
 function validateBrowserslistrc(project, workspaceState) {
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
    workspaceState.addFailed(
      'Expected file ".browserslistrc" to exist but it was not found.'
    );
    return;
  }

  const contents = fs.readFileSync(browserslistrcPath).toString();

  const missingBrowsers = [];
  for (const browser of REQUIRED_BROWSER_LIST) {
    if (!contents.includes(browser)) {
      missingBrowsers.push(browser);
    }
  }

  if (missingBrowsers.length > 0) {
    const spaces = '           ';
    workspaceState.addFailed(
      `The "${browserListFile}" file is missing the following required ` +
        'browser definition(s):' +
        `\n${spaces}---` +
        `\n${spaces}${missingBrowsers.join(`\n${spaces}`)}` +
        `\n${spaces}---`
    );
    return;
  }

  workspaceState.addPassed(
    'The .browserslistrc file includes all supported browsers.'
  );
}

module.exports = validateBrowserslistrc;
