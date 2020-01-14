const fs = require('fs-extra');

async function readJson(fileName) {
  if (await fs.exists(fileName)) {
    return await fs.readJson(fileName);
  }

  return undefined;
}

async function writeJson(fileName, contents) {
  await fs.writeJson(
    fileName,
    contents,
    {
      spaces: 2
    }
  );
}

module.exports = {
  readJson,
  writeJson
};
