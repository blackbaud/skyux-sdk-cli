const fs = require('fs-extra');
const path = require('path');

function modifyGitignore(ejectedProjectPath, patterns) {
  const gitignorePath = path.join(ejectedProjectPath, '.gitignore');

  let gitignore = fs.readFileSync(gitignorePath, {
    encoding: 'utf-8'
  });

  gitignore += '\n# SKY UX files\n' +
    patterns.join('\n') +
    '\n';

  fs.writeFileSync(gitignorePath, gitignore, {
    encoding: 'utf-8'
  });
}

module.exports = modifyGitignore;
