const fs = require('fs-extra');
const path = require('path');

function modifyRootReadme(ejectedProjectPath, projectDirectory, packageName) {
  // Overwrite the root-level README file to point to the project's README.
  const readmePath = path.join(ejectedProjectPath, 'README.md');
  fs.writeFileSync(readmePath, `# ${packageName} Workspace

For information about \`${packageName}\` please visit the library's README file, located at \`projects/${projectDirectory}/README.md\`.
`);
}

module.exports = modifyRootReadme;
