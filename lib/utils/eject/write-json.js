const fs = require('fs-extra');
const path = require('path');

function writeJson(filePath, contents) {
  fs.ensureDirSync(path.dirname(filePath));

  fs.writeJsonSync(filePath, contents, {
    spaces: 2
  });
}

module.exports = writeJson;
