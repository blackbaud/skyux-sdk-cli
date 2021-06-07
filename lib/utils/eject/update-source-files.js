const fs = require('fs-extra');
const glob = require('glob');
const logger = require('@blackbaud/skyux-logger');
const path = require('path');

function migrateAssetsPath(filePath, fileContents) {
  logger.verbose(`Looking for asset paths in ${filePath}...`);

  if (fileContents.indexOf('~/assets/') >= 0) {
    logger.verbose(`Processing asset paths in ${filePath}...`);

    fileContents = fileContents.replace(/~\/assets\//g, 'assets/');
  }

  logger.verbose('Done.');

  return fileContents;
}

function migrateTestImportPaths(ejectedProjectPath, filePath, fileContents) {
  if (path.extname(filePath).toLocaleUpperCase() === '.TS') {
    logger.verbose(`Looking for SKY UX testing import paths in ${filePath}...`);

    const containsI18nPath = fileContents.indexOf('@skyux/i18n/testing') >= 0;
    const containsRuntimePath = fileContents.indexOf('@skyux-sdk/builder/runtime/testing/browser') >= 0;

    if (containsI18nPath || containsRuntimePath) {
      const relativePath = path.relative(
        path.dirname(filePath),
        path.join(ejectedProjectPath, 'src', 'app', '__skyux', 'testing')
      ).replace(/\\/g, '/');

      if (containsI18nPath) {
        logger.verbose(`Processing SkyAppResourcesTestService import paths in "${filePath.replace(process.cwd(), '')}"...`);

        fileContents = fileContents.replace(/@skyux\/i18n\/testing/g, relativePath);
      }

      if (containsRuntimePath) {
        logger.verbose(`Processing SkyAppTestModule import paths in "${filePath.replace(process.cwd(), '')}"...`);

        fileContents = fileContents.replace(/@skyux-sdk\/builder\/runtime\/testing\/browser/g, relativePath);
      }
    }

    logger.verbose('Done.');
  }

  return fileContents;
}

function updateSourceFiles(ejectedProjectPath) {
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
    let fileContents = fs.readFileSync(
      filePath,
      {
        encoding: 'utf-8'
      }
    );

    const originalFileContents = fileContents;

    fileContents = migrateAssetsPath(filePath, fileContents);
    fileContents = migrateTestImportPaths(ejectedProjectPath, filePath, fileContents);

    if (fileContents !== originalFileContents) {
      logger.verbose(`Writing changes to ${filePath}...`);

      fs.writeFileSync(
        filePath,
        fileContents,
        {
          encoding: 'utf-8'
        }
      );
    }
  }

  logger.info('Done.');
}

module.exports = updateSourceFiles;
