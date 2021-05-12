const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

function getProjectRootPath(ejectedProjectPath, projectDirectory) {
  return path.join(ejectedProjectPath, `projects/${projectDirectory}`);
}

function copyRootFiles(ejectedProjectPath, projectDirectory, packageName) {
  // Move README to project directory.
  // Move the LICENSE to project directory.
  // Modify the root README file to point to the library README.
  // Keep the CHANGELOG where it is.
  const ejectedProjectRoot = getProjectRootPath(ejectedProjectPath, projectDirectory);

  // Move the following files to the ejected project's root.
  [
    'LICENSE',
    'README.md',
  ].forEach((fileName) => {
    const filePath = path.join(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      fs.moveSync(
        filePath,
        path.join(ejectedProjectRoot, fileName)
      );
    }
  });

  const readmePath = path.join(process.cwd(), 'README.md');
  if (fs.existsSync(readmePath)) {
    fs.writeFileSync(readmePath, `# \`${packageName}\` Workspace

For information about \`${packageName}\` please visit the library's README file, located at \`projects/${projectDirectory}\`.
`);
  }
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
