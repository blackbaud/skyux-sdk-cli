const fs = require('fs-extra');
const path = require('path');

const {
  REQUIRED_BROWSERS_LIST
} = require('./constants');

const CWD = process.cwd();

/**
 * Verifies that our list of supported browsers is included
 * in the project's .browserslistrc file.
 */
 function validateBrowserslistrc(project, workspaceState) {
  const browserListFile = '.browserslistrc';
  const browserslistrcPath = path.join(
    CWD,
    project.projectDefinition.root,
    browserListFile
  );

  if (!fs.existsSync(browserslistrcPath)) {
    workspaceState.addFailed(
      'Expected file ".browserslistrc" to exist but it was not found.'
    );
    return;
  }

  const contents = fs.readFileSync(browserslistrcPath).toString();

  const missingBrowsers = [];
  for (const browser of REQUIRED_BROWSERS_LIST) {
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
