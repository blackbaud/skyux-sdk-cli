const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const clone = require('git-clone');
const latestVersion = require('latest-version');
const path = require('path');
const promptly = require('promptly');
const npmInstall = require('./npm-install');

/**
 * Prompt for SPA name.
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
function checkoutNewBranch() {
  const message = logger.promise('Switching to branch initial-commit.');

  const npmProcess = spawn('git', ['checkout', '-b', 'initial-commit'], {
    cwd: settings.path,
    stdio: settings.stdio
  });

  return new Promise((resolve, reject) => {
    npmProcess.on('exit', (code) => {
      if (code !== 0) {
        message.fail();
        reject('Switching to branch initial-commit failed.');
        return;
      }

      message.succeed();
      resolve();
    });
  });
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
 * Finds all dependencies with a version specified as "latest", looks up the package in the global
 * NPM registry, and replaces it with the actual version number of the latest version of the package.
 * @param {*} dependencies The dependencies with versions to resolve.
 */
async function setDependencyVersions(dependencies) {
  const packageNames = Object.keys(dependencies);

  const dependencyPromises = packageNames.map(
    packageName => dependencies[packageName] === 'latest' ?
      latestVersion(packageName) :
      // Default to the specified version.
      Promise.resolve(dependencies[packageName])
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

  let descriptionType;
  switch (settings.template.name) {
    case 'library':
      descriptionType = 'Library';
      break;
    default:
      descriptionType = 'Single-page-application (SPA)';
      break;
  }

  packageJson.name = `blackbaud-${settings.name}`;
  packageJson.description = `${descriptionType} for ${settings.name}`;
  packageJson.dependencies = packageJson.dependencies || {};
  packageJson.devDependencies = packageJson.devDependencies || {};
  packageJson.peerDependencies = packageJson.peerDependencies || {};
  packageJson.repository = {
    type: 'git',
    url: settings.url
  };

  await setDependencyVersions(packageJson.dependencies);
  await setDependencyVersions(packageJson.devDependencies);
  await setDependencyVersions(packageJson.peerDependencies);

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
function cloneTemplate() {
  const message = logger.promise(`Cloning ${settings.template.name} SKY UX template.`);

  return new Promise((resolve, reject) => {
    clone(settings.template.url, settings.pathTmp, (err) => {
      if (err) {
        message.fail(`Template not found at location, ${settings.template.url}.`);
        reject(err);
        return;
      }

      message.succeed(`${settings.template.name} template successfully cloned.`);
      resolve();
    });
  });
}

/**
 * Clones the repo into the specified path
 * @name cloneRepo
 */
function cloneRepo() {
  return new Promise((resolve, reject) => {
    const message = logger.promise('Cloning your repository.');

    clone(settings.url, settings.path, (err) => {
      if (err) {
        message.fail();
        reject(err);
        return;
      }

      if (!isRepoEmpty(settings.path)) {
        message.fail();
        reject('skyux new only works with empty repositories.');
        return;
      }

      message.succeed();
      resolve();
    });
  });
}

/**
 * Prompts for the project's root repo URL.
 * @name promptForUrl
 */
function promptForUrl(args) {
  const message = 'What is the URL to your repo? (leave this blank if you don\'t know)';

  if (args.repo && typeof args.repo === 'string') {
    return args.repo;
  }

  return promptly.prompt(message, { 'default': '' });
}

/**
 * Prompts for the project's root directory name.
 * @name promptForName
 */
function promptForName(args) {
  const validator = (value) => {
    const packageName = getPackageName(value);

    if (!value || !value.match(/^[a-z0-9-]*$/)) {
      logger.error(
        'SPA root directories may only contain lower-case letters, numbers or dashes.'
      );
      throw new Error();
    } else if (fs.existsSync(path.join('.', packageName))) {
      logger.error('SPA directory already exists.');
      throw new Error();
    }

    logger.info(`Creating a new SPA named '${packageName}'.`);

    return value;
  };

  const prompt = () => {
    return promptly.prompt(
      'What is the root directory for your SPA? (example: my-spa-name)',
      { validator }
    );
  };

  if (args.name) {
    try {
      return validator(args.name);
    } catch (err) {
      logger.error(err.message);
      return prompt();
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

async function skyuxNew(args) {
  try {
    settings.template = getTemplateFromArgs(args);

    const projectName = await promptForName(args);
    settings.spa = projectName;
    settings.name = getPackageName(projectName);
    settings.path = path.join('.', settings.name);
    settings.pathTmp = path.join(settings.path, 'tmp');

    const repoUrl = await promptForUrl(args);
    settings.url = repoUrl;

    if (settings.url) {
      await cloneRepo();
    }

    await cloneTemplate();
    await updatePackageDependencies();

    cleanupTemplate();

    if (settings.url) {
      await checkoutNewBranch();
    }

    await npmInstall(settings);

    logger.info('SPA %s created in directory %s', settings.spa, settings.name);
    logger.info('Change into that directory and run "skyux serve" to begin.');
  } catch (err) {
    logger.error(err);
  }
}

module.exports = skyuxNew;
