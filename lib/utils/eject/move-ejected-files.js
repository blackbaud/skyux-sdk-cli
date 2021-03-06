const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const CWD = process.cwd();

/**
 * Moves the ejected files in the temp folder to the current working directory.
 */
function moveEjectedFilesToCwd(ejectedProjectPath) {
  logger.info('Moving ejected files to project\'s root directory. This might take a while...');

  fs.removeSync(path.join(CWD, 'node_modules'));
  fs.removeSync(path.join(CWD, 'src'));

  const ejectedFiles = glob.sync(path.join(ejectedProjectPath, '**/*'), {
    dot: true,
    ignore: [
      '**/node_modules/**/*'
    ],
    nodir: true
  });

  ejectedFiles.forEach((file) => {
    const resolved = path.join(file);
    fs.moveSync(
      resolved,
      path.join(CWD, resolved.replace(ejectedProjectPath, '')),
      {
        overwrite: true
      }
    );
  });

  fs.removeSync(ejectedProjectPath);

  logger.info('Done.');
}

module.exports = moveEjectedFilesToCwd;
