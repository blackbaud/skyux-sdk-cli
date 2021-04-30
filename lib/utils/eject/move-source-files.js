const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const CWD = process.cwd();

/**
 * Moves the original source files to a temporary folder.
 */
function moveSourceFilesToTemp(ejectedProjectPath, tempDir) {
  logger.info('Moving source files to temporary folder...');

  const files = glob.sync(path.join(CWD, '**/*'), {
    dot: true,
    ignore: [
      '**/.git/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      `**/${ejectedProjectPath}/**`
    ],
    nodir: true
  });

  files.forEach(file => {
    fs.copySync(
      file,
      path.join(
        CWD,
        tempDir,
        file.replace(CWD, '')
      )
    );
  });

  logger.info('Done.');
}

module.exports = moveSourceFilesToTemp;
