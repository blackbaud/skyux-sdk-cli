const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const CWD = process.cwd();

/**
 * Copies the original source files to a backup folder.
 */
function backupSourceFiles(ejectedProjectPath, tempDir) {
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

  files.forEach((file) => {
    const resolved = path.join(file);
    fs.copySync(resolved, path.join(CWD, tempDir, resolved.replace(CWD, '')));
  });

  logger.info('Done.');
}

module.exports = backupSourceFiles;
