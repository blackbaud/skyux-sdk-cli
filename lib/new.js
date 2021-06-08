const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');

const clone = require('./utils/clone');
const createAngularApplication = require('./utils/eject/create-angular-application');
const installAngularBuilders = require('./utils/eject/install-angular-builders');
const installESLint = require('./utils/install-eslint');
const jsonUtils = require('./utils/json-utils');
const npmInstall = require('./utils/npm-install');
const prettierUtils = require('./utils/prettier-utils');
const spawnUtils = require('./utils/spawn');
const modifyAppComponent = require('./utils/eject/modify-app-component');
const newLibrary = require('./utils/new/new-library');

/**
 * Prompt for SPA/library name.
 * Prompt for repo URL.
 * If repo URL provided...
 *   Clone from repo URL into destination.
 *   Confirm repo is empty, except for .git folder and README.md.
 * Clone from template into temp folder.
 * Copy contents of temp folder into destination.
 * Adjust package.json file.
 * Run npm install.
 */

const settings = {
  stdio: (logger.logLevel === 'verbose') ? 'inherit' : 'pipe'
};

/**
 * Returns a string to be used for the name property in package.json.
 * @name getPackageName
 */
function getPackageName(name) {
  let prefix;

  switch (settings.template.name) {
    case 'library':
      prefix = 'lib';
      break;
    default:
      prefix = 'spa';
      break;
  }

  return `skyux-${prefix}-${name}`;
}

/**
 * Returns a string to be used for the description property in package.json/logger.
 * @name getPackageDescriptionType
 */
function getPackageDescriptionType(settings) {
  switch (settings.template.name) {
    case 'library':
      return 'library';
    default:
      return 'single-page application (SPA)';
  }
}

/**
 * Verifies path is empty, execpt for README.md and .git folder
 * @name isRepoEmpty
 * @returns {Boolean} isPathEmpty
 */
function isRepoEmpty(dir) {
  const files = fs.readdirSync(dir);

  let isEmpty = true;

  files.forEach((file) => {
    if (file.indexOf('.git') === -1 && file.indexOf('README.md') === -1) {
      isEmpty = false;
    }
  });

  return isEmpty;
}

/**
 * Checkout a new branch.
 * @name checkoutNewBranch
 */
async function checkoutNewBranch() {
  const message = logger.promise('Switching to branch initial-commit.');

  try {
    await spawnUtils.spawnWithOptions(
      {
        cwd: settings.path,
        stdio: settings.stdio
      },
      `git`,
      `checkout`,
      `-b`,
      `initial-commit`
    );
    message.succeed();
  } catch (err) {
    message.fail();
    throw err;
  }
}

/**
 * Deletes the temp folder where the Angular project was created.
 * @name cleanupTempPath
 */
function cleanupTempPath() {
  try {
    fs.removeSync(path.join(settings.pathTmp, '.git'));
    fs.copySync(settings.pathTmp, settings.path, { mkdirp: true, clobber: true });
    fs.removeSync(settings.pathTmp);
  } catch (err) {
    logger.info('Temp path cleanup failed.');
  }
}

/**
 * Sets the latest versions of skyux + skyux-builder and to the package.json.
 */
async function updatePackageJson() {
  const message = logger.promise('Updating package.json.');
  const packagePath = path.join(settings.pathTmp, 'package.json');
  const packageJson = await jsonUtils.readJson(packagePath);

  packageJson.name = `blackbaud-${settings.name}`;
  packageJson.description = `A ${getPackageDescriptionType(settings)} named ${settings.name}`;
  packageJson.repository = {
    type: 'git',
    url: settings.url
  };

  await prettierUtils.addPrettierToDevDependencies(packageJson);

  await jsonUtils.writeJson(
    packagePath,
    packageJson
  );

  message.succeed('package.json updated.');
}

/**
 * Clones the repo into the specified path
 * @name cloneRepo
 */
async function cloneRepo() {
  const message = logger.promise('Cloning your repository.');

  try {
    await clone(settings.url, settings.path, 'master');

    if (isRepoEmpty(settings.path)) {
      message.succeed();
    } else {
      message.fail();

      // Matching signature of our git-clone utility
      throw {
        message: 'The command `skyux new` only works with empty repositories.'
      };
    }

  } catch (err) {
    message.fail();
    throw err.message;
  }
}

/**
 * Prompts for the project's root repo URL.
 * @name promptForUrl
 */
function promptForUrl(args) {
  const promptName = 'prompt-for-url';
  const message = 'What is the URL to your repo? (leave this blank if you don\'t know)';
  const defaultUrl = '';

  if (args.repo === false) {
    return defaultUrl;
  }

  if (args.repo && typeof args.repo === 'string') {
    return args.repo;
  }

  return inquirer.prompt([
    {
      type: 'input',
      name: promptName,
      message
    }
  ]).then(answer => answer[promptName]);
}

/**
 * Prompts for the project's root directory name.
 * @name promptForName
 */
function promptForName(args) {
  const isValid = (value) => {
    const packageName = getPackageName(value);

    if (!value || !value.match(/^[a-z0-9-]*$/)) {
      return {
        valid: false,
        message: 'SPA root directories may only contain lower-case letters, numbers or dashes.'
      };
    }

    if (fs.existsSync(path.join('.', packageName))) {
      return {
        valid: false,
        message: 'SPA directory already exists.'
      };
    }

    return {
      valid: true
    };
  };

  const validator = function (value) {
    const done = this.async();
    const check = isValid(value);
    if (!check.valid) {
      done(check.message);
      return;
    }

    done(null, true);
  };

  const prompt = () => {
    const promptName = 'prompt-for-name';
    return inquirer.prompt([
      {
        type: 'input',
        name: promptName,
        message: 'What is the root directory for your SPA? (example: my-spa-name)',
        validate: validator
      }
    ]).then((answer) => {
      const value = answer[promptName];
      logger.info(`\nCreating a ${getPackageDescriptionType(settings)} named '${getPackageName(value)}'...`);
      return value;
    });
  };

  if (args.name) {
    const check = isValid(args.name);
    if (check.valid) {
      return args.name;
    } else {
      logger.error(check.message);
    }
  }

  return prompt();
}

/**
 * Returns an object representing the template config, derived
 * from constructor arguments.
 * @name getTemplateFromArgs
 */
function getTemplateFromArgs(args) {
  const defaults = {
    name: 'default'
  };

  let name = '';
  if (args.template && typeof args.template === 'string') {
    // Allow custom template with `--template`.
    name = args.template;
  } else if (args.t && typeof args.t === 'string') {
    // The `-t` flag is an alias for `--template`.
    name = args.t;
  }

  if (!name) {
    return defaults;
  }

  const template = {
    name
  };

  return template;
}

async function skyuxNew(argv) {
  try {
    settings.template = getTemplateFromArgs(argv);

    const projectName = await promptForName(argv);
    settings.spa = projectName;
    settings.name = getPackageName(projectName);
    settings.path = path.join('.', settings.name);
    settings.pathTmp = path.join(`.${settings.path}-tmp`);

    const isLibrary = settings.template.name === 'library';
    let libraryProjectPath;

    if (isLibrary) {
      libraryProjectPath = path.join(settings.pathTmp, 'projects', projectName);
    }

    const repoUrl = await promptForUrl(argv);

    // This rule is part of the `eslint:recommended` ruleset, but will soon be removed because it
    // reports false positives.
    // eslint-disable-next-line require-atomic-updates
    settings.url = repoUrl;

    if (settings.url) {
      await cloneRepo();
    }

    if (isLibrary) {
      newLibrary(settings.pathTmp, projectName, settings.name);
    } else {
      createAngularApplication(settings.pathTmp, projectName, true);
      modifyAppComponent(settings.pathTmp, true);
    }

    installAngularBuilders(settings.pathTmp, true, true);

    await installESLint(settings.pathTmp, libraryProjectPath);

    await updatePackageJson();

    await prettierUtils.configurePrettier(settings.pathTmp);

    cleanupTempPath();

    if (settings.url) {
      await checkoutNewBranch();
    }

    await npmInstall(settings);

    prettierUtils.applyPrettierToFiles(settings.path);

    logger.info(`Created a ${getPackageDescriptionType(settings)} in directory ${settings.name}`);
    logger.info('Change into that directory and run `ng serve` to begin.');
  } catch (err) {
    logger.error(err);
  }
}

module.exports = skyuxNew;
