const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const CWD = process.cwd();

function copyFile(fileName, destinationRoot) {
  // Files from glob always use forward slashes, so we'll need to
  // resolve the directory separators for Windows machines.
  const resolved = path.join(fileName);
  fs.copySync(
    resolved,
    path.join(destinationRoot, resolved.replace(CWD, ''))
  );
}

/**
 * Copies all assets from the existing SKY UX application to the new Angular CLI application.
 */
function copyAssetsDirectory(ejectedProjectPath) {
  logger.info('Copying assets directory...');

  const assetsDirectory = path.join(CWD, 'src/assets');
  /*istanbul ignore else*/
  if (fs.existsSync(assetsDirectory)) {
    fs.copySync(assetsDirectory, path.join(ejectedProjectPath, 'src/assets'));
  }

  logger.info('Done.');
}

/**
 * Copies all source files from the existing SKY UX application to the new Angular CLI application.
 */
function copySrcAppFiles(ejectedProjectPath) {
  logger.info('Copying "./src/app" files...');

  const files = glob.sync(path.join(CWD, 'src/app/**/*'), {
    nodir: true,
    ignore: [
      '**/index.html',         // Handle index.html files in a different step.
      '**/src/app/public/**/*' // Don't worry about library files right now.
    ]
  });

  files.forEach(file => copyFile(file, ejectedProjectPath));

  logger.info('Done.');
}

function copySrcLibFiles(ejectedProjectPath) {
  logger.info('Copying "./src/lib" files...');

  const files = glob.sync(path.join(CWD, 'src/lib/**/*'), {
    nodir: true
  });

  files.forEach(file => copyFile(file, ejectedProjectPath));

  logger.info('Done.');
}

function copyRootProjectFiles(ejectedProjectPath) {
  logger.info('Copying root project files...');

  const files = [
    'README.md'
  ];

  files.forEach((file) => {
    const filePath = path.join(CWD, file);
    /*istanbul ignore else*/
    if (fs.existsSync(filePath)) {
      fs.copySync(
        path.join(CWD, file),
        path.join(ejectedProjectPath, file.replace(CWD, ''))
      );
    }
  });

  logger.info('Done.');
}

module.exports = {
  copyAssetsDirectory,
  copySrcAppFiles,
  copySrcLibFiles,
  copyRootProjectFiles,
};
