const logger = require('@blackbaud/skyux-logger');
const path = require('path');
const spawn = require('cross-spawn');

/**
 * Generates a new Angular CLI application.
 */
 function createAngularCliProject(ejectedProjectPath, projectName, strictMode) {
  const ejectedProjectDir = path.basename(ejectedProjectPath);

  logger.info(`Creating an Angular CLI project named "${projectName}", located at "./${ejectedProjectDir}".`);

  const strictModeArg = `--strict=${strictMode ? 'true' : 'false'}`;

  const args = [
    'new',
    projectName,
    `--directory=${ejectedProjectDir}`,
    '--legacy-browsers',  // Enables support for IE 11
    '--routing',          // Creates a routing module
    strictModeArg,        // Enables strict mode
    '--style=scss',       // Use scss for stylesheets
  ];

  spawn.sync(
    'ng',
    args,
    {
      stdio: 'inherit'
    }
  );
}

module.exports = createAngularCliProject;
