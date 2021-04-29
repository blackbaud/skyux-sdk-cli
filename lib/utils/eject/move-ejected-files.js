const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const CWD = process.cwd();

/**
 * Moves the ejected files in the temp folder to the project's root directory.
 */
function moveEjectedFilesToRoot(ejectedProjectPath) {
  logger.info('Moving ejected files to project\'s root directory. This might take a while...');

  fs.removeSync(path.join(CWD, 'node_modules'));
  fs.removeSync(path.join(CWD, 'src'));

  const ejectedFiles = glob.sync(path.join(ejectedProjectPath, '**/*'), {
    nodir: true,
    ignore: [
      '**/node_modules/**/*'
    ]
  });

  ejectedFiles.forEach((file) => {
    fs.moveSync(
      file,
      path.join(CWD, file.replace(ejectedProjectPath, ''))
    );
  });

  fs.removeSync(ejectedProjectPath);

  logger.info('Done.');
}

module.exports = moveEjectedFilesToRoot;
