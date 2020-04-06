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

  for (const fileName of Object.keys(results)) {
    logger.info(`Updating /deep/ selectors in ${fileName}...`);

    let fileContents = await fs.readFile(fileName, 'utf8');

    fileContents = fileContents.replace(/(\/deep\/|>>>)/g, '::ng-deep');

    fs.writeFile(fileName, fileContents);
  }
}

module.exports = {
  fixSassDeep
};
