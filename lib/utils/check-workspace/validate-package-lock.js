const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

const CWD = process.cwd();

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

  logger.info(
    '✓ A valid package-lock.json file exists. OK.'
  );
}

module.exports = validatePackageLock;
