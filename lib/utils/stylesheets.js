const logger = require('@blackbaud/skyux-logger');
const findInFiles = require('find-in-files');
const fs = require('fs-extra');

async function fixSassDeep() {
  const results = await findInFiles.find(
    {
      term: '(/deep/|>>>)',
      flags: 'g'
    },
    'src',
    '\\.scss$'
  );

  const fileNames = Object.keys(results);
  if (!fileNames.length) {
    return;
  }

  const readPromises = fileNames.map((fileName) => {
    logger.info(`Updating /deep/ selectors in ${fileName}...`);
    return fs.readFile(fileName, 'utf8');
  });

  const fileContents = await Promise.all(readPromises);

  const writePromises = fileContents.map((fileContent, i) => {
    const modified = fileContent.replace(/(\/deep\/|>>>)/g, '::ng-deep');
    return fs.writeFile(fileNames[i], modified);
  });

  await Promise.all(writePromises);

  logger.info('Done.');
}

module.exports = {
  fixSassDeep
};
