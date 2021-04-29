const fs = require('fs-extra');
const path = require('path');

function modifyGitignore(ejectedProjectPath) {
  const gitignorePath = path.join(ejectedProjectPath, '.gitignore');

  let gitignore = fs.readFileSync(gitignorePath, {
    encoding: 'utf-8'
  });

  gitignore += '\n# SKY UX files\n' +
    '/screenshots-baseline-local\n' +
    '/screenshots-diff-local\n';

  fs.writeFileSync(gitignorePath, gitignore, {
    encoding: 'utf-8'
  });
}

module.exports = modifyGitignore;
