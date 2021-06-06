const fs = require('fs-extra');
const path = require('path');

const CWD = process.cwd();

/**
 * Checks if the project includes a package-lock.json file.
 * We check for the existence of the lock file to avoid transitive
 * dependencies and to foster build-to-build consistency.
 */
 function validatePackageLock(workspaceState) {
  if (!fs.existsSync(path.join(CWD, 'package-lock.json'))) {
    workspaceState.addFailed(
      'A valid package-lock.json file was not found. Run `npm install` ' +
        'to generate a new package-lock.json file and confirm it is ' +
        'not listed in your project\'s .gitignore file.'
    );
    return;
  }

  workspaceState.addPassed(
    'A valid package-lock.json file exists.'
  );
}

module.exports = validatePackageLock;
