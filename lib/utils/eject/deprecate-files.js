const fs = require('fs-extra');
const path = require('path');

function deprecateFile(ejectedProjectPath, fileName, instructions) {
  const filePath = path.join(ejectedProjectPath, 'src', 'app', fileName);

  let fileContents = fs.readFileSync(filePath, 'utf-8');

  if (fileContents.indexOf(`@deprecated`) < 0) {
    fileContents = fileContents.replace(
      '@NgModule',
      `/**
 * @deprecated ${instructions}
 */
@NgModule`
    );

    fs.writeFileSync(
      filePath,
      fileContents,
      {
        encoding: 'utf-8'
      }
    );
  }
}

/**
 * Adds deprecation warnings to files that should be refactored.
 */
function deprecateFiles(ejectedProjectPath) {
  deprecateFile(
    ejectedProjectPath,
    'app-extras.module.ts',
    'Provided services, imported modules, etc. should be moved to their respective feature modules, and this module should be removed.'
  );

  deprecateFile(
    ejectedProjectPath,
    'app-sky.module.ts',
    'Each SKY UX module should be imported into each feature module that reference the SKY UX module, and this module should be removed.'
  );
}

module.exports = deprecateFiles;
