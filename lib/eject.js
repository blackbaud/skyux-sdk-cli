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

function addAuthLibraries(projectDirectory) {
  spawn.sync('ng', ['add', '@blackbaud-internal/skyux-auth'], {
    stdio: 'inherit',
    cwd: projectDirectory
  });
  spawn.sync('ng', ['add', '@blackbaud-internal/skyux-auth-blackbaud-employee'], {
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

// function copyComponents(projectDirectory) {
//   const files = glob.sync(path.join(process.cwd(), 'src/app', '**/*.component.*'), {
//     nodir: true,
//     ignore: [
//       'src/app/public/**/*'
//     ]
//   });

//   files.forEach(file => {
//     fs.copySync(file, path.join(projectDirectory, file.replace(process.cwd(), '')))
//   });
// }

function generateRoutes() {}

function copyAppFiles(projectDirectory) {
  const files = glob.sync(path.join(process.cwd(), 'src/app', '**/*'), {
    nodir: true,
    ignore: [
      '**/index.guard.ts',
      '**/index.html',
      'src/app/public/**/*'
    ]
  });

  files.forEach(file => {
    fs.copySync(file, path.join(projectDirectory, file.replace(process.cwd(), '')))
  });
}

function addAppExtrasModuleToMainModuleImports(projectDirectory) {
  const mainModulePath = path.join(projectDirectory, 'src/app/app.module.ts');

  let source = fs.readFileSync(mainModulePath, { encoding: 'utf-8' });

  if (source.indexOf('AppExtrasModule') > -1) {
    return;
  }

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

const STRING_CAMELIZE_REGEXP = (/(-|_|\.|\s)+(.)?/g);
function camelize(str) {
  return str
    .replace(STRING_CAMELIZE_REGEXP, (_match, _separator, chr) => {
      return chr ? chr.toUpperCase() : '';
    })
    .replace(/^([A-Z])/, (match) => match.toLowerCase());
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

const STRING_DASHERIZE_REGEXP = (/[ _]/g);
function dasherize(str) {
  return decamelize(str).replace(STRING_DASHERIZE_REGEXP, '-');
}

const STRING_DECAMELIZE_REGEXP = (/([a-z\d])([A-Z])/g);
function decamelize(str) {
  return str.replace(STRING_DECAMELIZE_REGEXP, '$1_$2').toLowerCase();
}

function classify(str) {
  return str.split('.').map(part => capitalize(camelize(part))).join('.');
}

function extractComponentName(file) {
  const content = fs.readFileSync(file, { encoding: 'utf8' });
  const matches = content.split(/@Component\s*\([\s\S]+?\)\s*export\s+class\s+(\w+)/g);

  switch (matches.length) {
    case 3:
      return matches[1];

    case 1:
    case 2:
      throw new Error(`Unable to locate an exported class in ${file}`);

    default:
      throw new Error(`As a best practice, please export one component per file in ${file}`);
  }
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
  // addAuthLibraries(projectDirectory);
  copyAssetsDirectory(projectDirectory);
  copyAppFiles(projectDirectory);
  // copyComponents(projectDirectory);
  generateRoutes();
  addAppExtrasModuleToMainModuleImports(projectDirectory);

  const indexFiles = glob.sync(path.join(process.cwd(), 'src/app/**/index.html'), {
    nodir: true,
    ignore: [
      '**/src/app/index.html'
    ]
  });

  indexFiles.forEach(indexFile => {
    const parentDir = path.dirname(indexFile).replace(path.join(process.cwd(), 'src/app/'), '').replace(/\/|\\/g, '-');
    const className = `Sky${classify(parentDir)}RouteIndexComponent`;
    const contents = fs.readFileSync(indexFile, { encoding: 'utf-8' });
    const newFileName = path.join(projectDirectory, path.dirname(indexFile).replace(process.cwd(), ''), `__route-index.component.ts`);
    fs.createFileSync(newFileName);
    fs.writeFileSync(
      newFileName,
      `import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-${dasherize(parentDir)}-route-index',
  template: \`${contents}\`
})
export class ${className} { }\n`, {}
    );
  });

  const componentFiles = glob.sync(path.join(projectDirectory, 'src/app/**/*.component.ts'), {
    nodir: true,
    ignore: [
      '**/app.component.ts',
      '**/__route-index.component.ts'
    ]
  });

  const componentNames = componentFiles.map(file => extractComponentName(file));

  const componentImports = componentFiles.map((file, i) => {
    return `import {${componentNames[i]}} from '${file.replace(path.join(projectDirectory, 'src/app/'), './').replace('.ts', '')}';`;
  });

  const routeComponentFiles = glob.sync(path.join(projectDirectory, 'src/app/**/__route-index.component.ts'), {
    nodir: true
  });

  const routeComponentNames = routeComponentFiles.map(file => extractComponentName(file));

  const routeComponentImports = routeComponentFiles.map((file, i) => {
    return `import {${routeComponentNames[i]}} from '${file.replace(path.join(projectDirectory, 'src/app/'), './').replace('.ts', '')}';`;
  });

  fs.writeFileSync(path.join(projectDirectory, 'src/app/__sky-pages.module.ts'), `
import {NgModule} from '@angular/core';
${componentImports.join('\n')}
${routeComponentImports.join('\n')}
@NgModule({
  declarations: [
    ${componentNames.concat(routeComponentNames).sort().join(',\n    ')}
  ],
  exports: [
    ${componentNames.sort().join(',\n    ')}
  ]
})
export class SkyPagesModule { }
`);

  // Add auth libraries.
  // TODO --> add ng-add schematics!

  // TODO: Grab every index.html file and create a router module.
  // Take it from builder?
  // https://github.com/blackbaud/skyux-sdk-builder/blob/master/lib/sky-pages-module-generator.js

  // TODO: Run `ng lint --fix`

  // TODO: Overwrite app.component.ts from SkyPages.

  /**
   * 1. Create a new module `@deprecated__SkyPagesModule`.
   * 2. Copy components and add them to `@deprecated__SkyPagesModule.declarations,exports`.
   * 4. For every index.html file, generate a new `@deprecated__Sky{About}IndexComponent` and add them to `__SkyPagesModule.declarations`.
   */

  // try {
  //   const skyPagesConfigUtil = require(path.join(process.cwd(), 'node_modules/@skyux-sdk/builder/config/sky-pages/sky-pages.config'));
  //   const routeGenerator = require(path.join(process.cwd(), 'node_modules/@skyux-sdk/builder/lib/sky-pages-route-generator'));
  //   const skyPagesConfig = skyPagesConfigUtil.getSkyPagesConfig('serve');
  //   const routes = routeGenerator.getRoutes(skyPagesConfig);
  //   console.log(routes.definitions);
  // } catch (err) {
  //   console.error(err);
  // }

  logger.info('Done ejecting Angular CLI application.');
}

module.exports = eject;
