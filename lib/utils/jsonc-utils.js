const fs = require('fs-extra');
const commentJson = require('comment-json');

/**
 * Reads and parses JSONC files (JSON files with comments).
 */
 function readJsonC(file) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `File "${file}" not found or is unreadable.`
    );
  }

  const contents = fs.readFileSync(file).toString();

  return commentJson.parse(contents);
}

module.exports = {
  readJsonC
};
