const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

function getProjectRootPath(ejectedProjectPath, projectDirectory) {
  return path.join(ejectedProjectPath, `projects/${projectDirectory}`);
}

function copyRootFiles(ejectedProjectPath, projectDirectory) {
  const copyDestinationRoot = getProjectRootPath(ejectedProjectPath, projectDirectory);
  [
    'README.md',
    'CHANGELOG.md'
  ].forEach((fileName) => {
    fs.copySync(
      path.join(process.cwd(), fileName),
      path.join(copyDestinationRoot, fileName)
    );
  });
}

function copySourceFiles(sourcePath, ejectedProjectPath, projectDirectory) {
  logger.info('Copying library source files...');

  const copyDestinationRoot = getProjectRootPath(ejectedProjectPath, projectDirectory);
  const copyDestinationSrc = path.join(copyDestinationRoot, 'src');

  // Delete some of the template files Angular generated.
  fs.removeSync(path.join(copyDestinationSrc, 'lib'));
  fs.removeSync(path.join(copyDestinationSrc, 'public-api.ts'));

  // Copy source files.
  fs.copySync(sourcePath, copyDestinationSrc);

  // Rename the `public_api.ts` file to what Angular recommends.
  fs.renameSync(
    path.join(copyDestinationSrc, 'public_api.ts'),
    path.join(copyDestinationSrc, 'public-api.ts')
  );

  logger.info('Done.');
}

module.exports = {
  copyRootFiles,
  copySourceFiles
};
