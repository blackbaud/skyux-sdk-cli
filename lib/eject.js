const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const cliVersion = require('./utils/cli-version');

function createAngularCliProject(projectName) {
  spawn.sync('ng', [
    'new', projectName,
    '--legacy-browsers',
    '--routing',
    '--strict',
    '--style=scss'
  ], {
    stdio: 'inherit'
  });
}

function addAngularBuilder(projectDirectory) {
  spawn.sync('ng', ['add', '@skyux-sdk/angular-builders'], {
    stdio: 'inherit',
    cwd: projectDirectory
  });
}

function copyAssetsDirectory(projectDirectory) {
  logger.info('Copying assets directory...');
  const assetsDirectory = path.join(process.cwd(), 'src/assets');
  if (fs.existsSync(assetsDirectory)) {
    fs.copySync(assetsDirectory, path.join(projectDirectory, 'src/assets'));
  }
  logger.info('Done copying assets.');
}

function copyAppFiles(projectDirectory) {
  const files = glob.sync(path.join(process.cwd(), 'src/app', '**/*'), {
    nodir: true,
    ignore: ['src/app/public/**/*']
  });

  files.forEach(file => {
    fs.copySync(file, path.join(projectDirectory, file.replace(process.cwd(), '')))
  });
}

function addAppExtrasModuleToMainModuleImports(projectDirectory) {
  const mainModulePath = path.join(projectDirectory, 'src/app/app.module.ts');

  let source = fs.readFileSync(mainModulePath, { encoding: 'utf-8' });

  const ngModuleMatches = source.match(/@NgModule\s*\([\s\S]+\)/g);

  let ngModuleSource = ngModuleMatches[0];

  // Ensure the NgModel decorator has an `imports` section.
  const importsMatches = ngModuleSource.match(/(imports\s*:\s*\[[\s\S]*\])/g);

  let importsSource;
  if (importsMatches) {
    importsSource = importsMatches[0];
  } else {
    const ngModuleSourceStart = ngModuleSource.substr(0, ngModuleSource.indexOf('{') + 1);
    const ngModuleSourceEnd = ngModuleSource.substr(ngModuleSourceStart.length);

    const hasOtherModuleProps = ngModuleSourceEnd.replace(/\s/g, '') !== '})';

    importsSource = `
imports: []${hasOtherModuleProps ? ',' : '\n'}`;

    ngModuleSource = ngModuleSource.replace(ngModuleSourceStart, ngModuleSourceStart + importsSource);
  }

  // Add the `AppSkyModule` to imports.
  const importsSourceStart = importsSource.substr(0, importsSource.indexOf('[') + 1);
  const importsSourceEnd = importsSource.substring(importsSourceStart.length, importsSource.indexOf(']') + 1);

  ngModuleSource = `import {
  AppExtrasModule
} from './app-extras.module';\n
` +
  ngModuleSource.replace(
    importsSourceStart,
    importsSourceStart + `
    AppExtrasModule${importsSourceEnd === ']' ? '\n  ' : ','}`
  );

  source = source.replace(ngModuleMatches[0], ngModuleSource);

  fs.writeFileSync(mainModulePath, source);
}

async function eject() {
  await cliVersion.verifyLatestVersion();

  const skyuxConfigPath = path.join(process.cwd(), 'skyuxconfig.json');
  if (!fs.existsSync(skyuxConfigPath)) {
    logger.error('A skyuxconfig.json file was not found. Please execute this command within a SKY UX project.');
    process.exit(1);
  }

  logger.info('Ejecting an Angular CLI application (this might take several minutes)...');

  const skyuxConfig = fs.readJsonSync(skyuxConfigPath);
  const projectName = skyuxConfig.name || path.basename(process.cwd());
  const projectDirectory = path.join(process.cwd(), projectName);

  if (!fs.existsSync(projectDirectory)) {
    createAngularCliProject(projectName);
  } else {
    logger.info('Skipping project generation because it already exists.');
  }

  addAngularBuilder(projectDirectory);
  copyAssetsDirectory(projectDirectory);
  copyAppFiles(projectDirectory);
  addAppExtrasModuleToMainModuleImports(projectDirectory);

  // TODO: Grab every index.html file and create a router module.

  logger.info('Done ejecting Angular CLI application.');
}

module.exports = eject;
