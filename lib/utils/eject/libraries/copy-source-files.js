const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const path = require('path');

function copySourceFiles(sourcePath, ejectedProjectPath, projectDirectory) {
  logger.info('Copying library source files...');

  const copyDestinationRoot = path.join(ejectedProjectPath, `projects/${projectDirectory}/src`);

  // Delete some of the template files Angular generated.
  fs.removeSync(path.join(copyDestinationRoot, 'lib'));
  fs.removeSync(path.join(copyDestinationRoot, 'public-api.ts'));

  // Copy source files.
  fs.copySync(sourcePath, copyDestinationRoot);

  // Rename the `public_api.ts` file to what Angular recommends.
  fs.renameSync(
    path.join(copyDestinationRoot, 'public_api.ts'),
    path.join(copyDestinationRoot, 'public-api.ts')
  );

  logger.info('Done.');
}

module.exports = copySourceFiles;
