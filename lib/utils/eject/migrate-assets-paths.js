const fs = require('fs-extra');
const glob = require('glob');
const logger = require('@blackbaud/skyux-logger');
const path = require('path');

function migrateAssetsPaths(ejectedProjectPath) {
  logger.info('Migrating assets paths...');

  const filePaths = glob.sync(
    path.join(ejectedProjectPath, 'src/app/**/*.+(html|css|scss|ts)'),
    {
      nodir: true,
      ignore: [
        '**/node_modules'
      ]
    }
  );

  for (const filePath of filePaths) {
    logger.verbose(`Looking for asset paths in ${filePath}...`);

    let contents = fs.readFileSync(
      filePath,
      {
        encoding: 'utf-8'
      }
    );

    if (contents.indexOf('~/assets/') >= 0) {
      logger.info(`Processing asset paths in ${filePath}...`);

      contents = contents.replace(/~\/assets\//g, 'assets/');

      logger.verbose(`Writing changes to ${filePath}...`);

      fs.writeFileSync(
        filePath,
        contents,
        {
          encoding: 'utf-8'
        }
      );
    }
  }
}

module.exports = migrateAssetsPaths;
