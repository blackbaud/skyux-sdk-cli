const fs = require('fs');
const path = require('path');
const glob = require('glob');
const logger = require('@blackbaud/skyux-logger');

const generator = require('./lib/utils/certs/generator');
const gitUtils = require('./lib/utils/git-utils');

/**
 * Returns results of glob.sync from specified directory and our glob pattern.
 * @returns {Array} Array of matching patterns
 */
function getGlobs() {

  // Look globally and locally for matching glob pattern
  const dirs = [
    `${process.cwd()}/node_modules/`, // local (where they ran the command from)
    `${__dirname}/..`,  // global, if scoped package (where this code exists)
    `${__dirname}/../..`, // global, if not scoped package
  ];

  let globs = [];

  dirs.forEach(dir => {
    const legacyPattern = path.join(dir, '*/skyux-builder*/package.json');
    const newPattern = path.join(dir, '@skyux-sdk/builder*/package.json');

    logger.verbose(`Looking for modules in ${legacyPattern} and ${newPattern}.`);

    globs = globs.concat([
      ...glob.sync(legacyPattern),
      ...glob.sync(newPattern)
    ]);
  });

  return globs;
}

/**
 * Iterates over the given modules.
 * @param {string} command
 * @param {Object} argv
 * @param {Array} globs
 * @returns {Array} modulesAnswered
 */
function getModulesAnswered(command, argv, globs) {
  let modulesCalled = {};
  let modulesAnswered = [];

  globs.forEach(pkg => {
    const dirName = path.dirname(pkg);
    let pkgJson = {};
    let module;

    try {
      module = require(dirName);
      pkgJson = require(pkg);
    } catch (err) {
      logger.verbose(`Error loading ${pkg}. ${err.stack}`);
    }

    if (module && typeof module.runCommand === 'function') {
      const pkgName = pkgJson.name || dirName;

      if (modulesCalled[pkgName]) {
        logger.verbose(`Multiple instances were found. Skipping passing the command to ${pkgName} at ${pkg}.`);
      } else {
        logger.verbose(`Passing the command to ${pkgName} at ${pkg}.`);

        modulesCalled[pkgName] = true;
        if (module.runCommand(command, argv)) {
          modulesAnswered.push(pkgName);
        }

      }
    }
  });

  return modulesAnswered;
}

/**
 * Log fatal error and exit.
 * This method is called even for internal commands.
 * In those cases, there isn't actually an error.
 * @param {string} command
 * @param {boolean} isInternalCommand
 */
function invokeCommandError(command, isInternalCommand) {

  if (isInternalCommand) {
    return;
  }

  const cwd = process.cwd();
  logger.error(`No modules were found that handle the '${command}' command. Please check your syntax. For more information, use the 'help' command.`);

  if (cwd.indexOf('skyux-spa') === -1) {
    logger.error(`Are you in a SKY UX SPA directory?`);
  } else if (!fs.existsSync('./node_modules')) {
    logger.error(`The 'node_modules' folder was not found. Did you run 'npm install'?`);
  }

  process.exit(1);
}

/**
 * search for a command in the modules and invoke it if found. If not found,
 * log a fatal error.
 * @param {string} command
 * @param {Object} argv
 * @param {boolean} isInternalCommand
 */
function invokeCommand(command, argv, isInternalCommand) {
  const globs = getGlobs();

  if (globs.length === 0) {
    return invokeCommandError(command, isInternalCommand);
  }

  const modulesAnswered = getModulesAnswered(command, argv, globs);
  const modulesAnsweredLength = modulesAnswered.length;

  if (modulesAnsweredLength === 0) {
    return invokeCommandError(command, isInternalCommand);
  }

  const modulesAnsweredPlural = modulesAnsweredLength === 1 ? 'module' : 'modules';

  logger.verbose(
    `Successfully passed the '${command}' command to ${modulesAnsweredLength} ${modulesAnsweredPlural}:`
  );
  logger.verbose(modulesAnswered.join(', '));
}

/**
 * Determines the correct command based on the argv param.
 * @param {Object} argv
 */
function getCommand(argv) {
  let command = argv._[0] || 'help';

  // Allow shorthand "-v" for version
  if (argv.v) {
    command = 'version';
  }

  // Allow shorthand "-h" for help
  if (argv.h) {
    command = 'help';
  }

  return command;
}

function validateCert(command, argv) {
  switch (command) {
    case 'serve':
    case 'e2e':
      return generator.validate(argv);

    case 'build':
      if (argv.s || argv.serve) {
        return generator.validate(argv);
      }
    break;
  }

  return true;
}

/**
 * Processes an argv object.
 * Reads package.json if it exists.
 * @name processArgv
 * @param [Object] argv
 */
function processArgv(argv) {
  const command = getCommand(argv);
  let isInternalCommand = true;

  logger.info(`SKY UX is processing the '${command}' command.`);

  // Don't validate custom sslCert and sslKey
  if (!argv.sslCert && !argv.sslKey) {

    argv.sslCert = generator.getCertPath();
    argv.sslKey = generator.getKeyPath();

    // Validate cert for specific scenarios
    if (!validateCert(command, argv)) {
      logger.warn(`Unable to validate ${argv.sslCert} and ${argv.sslKey}.`);
      logger.warn(`You may proceed, but \`skyux ${command}\` may not function properly.`)
      logger.warn('Please install the latest SKY UX CLI and run `skyux certs install`.');
    }
  }

  // Catch skyux install certs when they meant skyux certs install
  const [ isInstall, isCerts ] = argv['_'];
  if (isInstall === 'install' && isCerts === 'certs') {
    logger.error('The `skyux install` command is invalid.');
    logger.error('Did you mean to run `skyux certs install` instead?');
    return;
  }

  switch (command) {
    case 'version':
      require('./lib/version').logVersion(argv);
      break;
    case 'new':
      require('./lib/new')(argv);
      break;
    case 'help':
      require('./lib/help')(argv);
      break;
    case 'install':
      require('./lib/install')(argv);
      break;
    case 'certs':
      require('./lib/certs')(argv);
      break;
    case 'upgrade':
      require('./lib/upgrade')(argv);
      break;
    case 'migrate':
      require('./lib/migrate')(argv);
      break;
    case 'eject':
      require('./lib/eject')(argv);
      break;
    default:
      isInternalCommand = false;
  }

  const gitOriginUrl = gitUtils.getOriginUrl();
  const isPrivateRepo =
    gitOriginUrl.includes('blackbaud.visualstudio.com') ||
    gitOriginUrl.includes('dev.azure.com');

  if (isInternalCommand && isPrivateRepo) {
    logger.warn(
      'WARNING: SKY UX CLI\'s source code was moved to Azure DevOps and is now released ' +
        'to the internal NPM feed. Uninstall your local copy of the old CLI and install the ' +
        'new one. The new CLI has the same commands as the old one and is backward compatible ' +
        'for SKY UX 4 (and lower) projects, so it can be safely used from now on.\n\n' +
        '==================================================\n' +
        'npm uninstall --global @skyux-sdk/cli\n' +
        'npm install --global @blackbaud-internal/skyux-cli\n'+
        '==================================================\n'
    );
  }

  invokeCommand(command, argv, isInternalCommand);
}

module.exports = processArgv;
