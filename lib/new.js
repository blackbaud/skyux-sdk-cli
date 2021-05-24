const logger = require('@blackbaud/skyux-logger');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const latestVersion = require('latest-version');
const path = require('path');

const clone = require('./utils/clone');
const npmInstall = require('./utils/npm-install');
const spawnUtils = require('./utils/spawn');

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
 * Removes the .git folder. Prepares files.
 * @name cleanupTemplate
 */
function cleanupTemplate() {
  try {
    fs.removeSync(path.join(settings.pathTmp, '.git'));
    fs.copySync(settings.pathTmp, settings.path, { mkdirp: true, clobber: true });
    fs.removeSync(settings.pathTmp);
  } catch (err) {
    logger.info('Template cleanup failed.');
  }
}

/**
 * Pass each dependency and it's requested version through the `install-latest` library.
 * This supports any valid semver version, but will resolve to the exact version.
 * @param {*} dependencies The dependencies with versions to resolve.
 */
async function setDependencyVersions(dependencies) {
  const packageNames = Object.keys(dependencies);

  const dependencyPromises = packageNames.map(
    packageName => latestVersion(packageName, { version: dependencies[packageName] })
  );

  const versionNumbers = await Promise.all(dependencyPromises);

  packageNames.forEach((packageName, index) => {
    dependencies[packageName] = versionNumbers[index];
  });
}

/**
 * Sets the latest versions of skyux + skyux-builder and to the package.json.
 */
async function updatePackageDependencies() {
  const message = logger.promise('Updating package dependencies.');
  const packagePath = path.join(settings.pathTmp, 'package.json');
  const packageJson = fs.readJsonSync(packagePath);

  packageJson.name = `blackbaud-${settings.name}`;
  packageJson.description = `A ${getPackageDescriptionType(settings)} named ${settings.name}`;
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};
  packageJson.peerDependencies = packageJson.peerDependencies || {};
  packageJson.repository = {
    type: 'git',
    url: settings.url
  };

  await setDependencyVersions(packageJson.dependencies);
  await setDependencyVersions(packageJson.devDependencies);

  await fs.writeJson(
    packagePath,
    packageJson,
    {
      spaces: 2
    }
  );
  message.succeed('Latest dependencies set.');
}

/**
 * Clone the template into a temp path.
 * @name cloneTemplate
 */
async function cloneTemplate(argv) {
  const message = logger.promise(`Cloning ${settings.template.name} SKY UX template.\n`);

  try {
    await clone(settings.template.url, settings.pathTmp, (argv && argv.checkout) || '4.x.x');
    message.succeed(`${settings.template.name} template successfully cloned.`);
  } catch (err) {

    // Status code 1 means the branch did not exist
    if (err.message.indexOf('status 1,') > -1) {
      message.fail(`Template found but missing corresponding ${err.branch} branch. Please consult the template owner or use the '--branch' flag.`);

    // Status code 128 means the template did not exist
    } else {
      message.fail(`Template not found at location, ${settings.template.url}.`);
    }

    throw err.message;
  }
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
    name: 'default',
    url: 'https://github.com/blackbaud/skyux-sdk-template'
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

  if (name.indexOf(':') > -1) {
    template.url = name;
  } else {
    template.url = `${defaults.url}-${name}`;
  }

  return template;
}

async function skyuxNew(argv) {
  try {
    settings.template = getTemplateFromArgs(argv);

    const projectName = await promptForName(argv);
    settings.spa = projectName;
    settings.name = getPackageName(projectName);
    settings.path = path.join('.', settings.name);
    settings.pathTmp = path.join(settings.path, 'tmp');

    const repoUrl = await promptForUrl(argv);

    // This rule is part of the `eslint:recommended` ruleset, but will soon be removed because it
    // reports false positives.
    // https://github.com/eslint/eslint/issues/11899#issuecomment-541714523
    // eslint-disable-next-line require-atomic-updates
    settings.url = repoUrl;

    if (settings.url) {
      await cloneRepo();
    }

    await cloneTemplate(argv);
    await updatePackageDependencies();

    cleanupTemplate();

    if (settings.url) {
      await checkoutNewBranch();
    }

    await npmInstall(settings);

    logger.info(`Created a ${getPackageDescriptionType(settings)} in directory ${settings.name}`);
    logger.info('Change into that directory and run `skyux serve -l local` to begin.');
  } catch (err) {
    logger.error(err);
  }
}

module.exports = skyuxNew;
