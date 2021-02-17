const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const cliVersion = require('./utils/cli-version');
// const strings = require('./utils/strings');
const routesGenerator = require('./utils/routes-generator');

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

// function addAuthLibraries(projectDirectory) {
//   spawn.sync('ng', ['add', '@blackbaud-internal/skyux-auth'], {
//     stdio: 'inherit',
//     cwd: projectDirectory
//   });
//   spawn.sync('ng', ['add', '@blackbaud-internal/skyux-auth-blackbaud-employee'], {
//     stdio: 'inherit',
//     cwd: projectDirectory
//   });
// }

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
    ignore: [
      '**/index.html',
      'src/app/public/**/*'
    ]
  });

  files.forEach(file => {
    fs.copySync(file, path.join(projectDirectory, file.replace(process.cwd(), '')))
  });
}

function addModuleToMainModuleImports(projectDirectory, className, importPath, ) {
  const mainModulePath = path.join(projectDirectory, 'src/app/app.module.ts');

  let source = fs.readFileSync(mainModulePath, { encoding: 'utf-8' });

  if (source.indexOf(className) > -1) {
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

  ngModuleSource = `import { ${className} } from '${importPath}';\n
` +
  ngModuleSource.replace(
    importsSourceStart,
    importsSourceStart + `
    ${className}${importsSourceEnd === ']' ? '\n  ' : ','}`
  );

  source = source.replace(ngModuleMatches[0], ngModuleSource);

  fs.writeFileSync(mainModulePath, source);
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

// function createRouteComponent(projectRoot, className, indexFilePath, destinationPath) {
//   const contents = fs.readFileSync(indexFilePath, { encoding: 'utf-8' });
//   const parentDir = path.dirname(indexFilePath).replace(path.join(process.cwd(), 'src/app'), '');

//   fs.writeFileSync(
//     destinationPath,
//     `import { Component } from '@angular/core';
// @Component({
//   selector: 'app-route-index',
//   template: \`${contents}\`
// })
// export class ${className} { }\n`
//   );
//   return {
//     className,
//     relativePath: destinationPath.replace(path.join(projectRoot, 'src/app'), '.'),
//     route: parentDir
//   };
// }

// function generateRouteComponents(projectDirectory) {
//   const components = [];

//   components.push(
//     createRouteComponent(
//       projectDirectory,
//       'SkyAppRouteIndexComponent',
//       path.join(process.cwd(), 'src/app/index.html'),
//       path.join(projectDirectory, 'src/app/app-route-index.component.ts')
//     )
//   );

//   const indexFiles = glob.sync(path.join(process.cwd(), 'src/app/**/index.html'), {
//     nodir: true,
//     ignore: [
//       '**/src/app/index.html'
//     ]
//   });

//   indexFiles.forEach(indexFile => {
//     const parentDir = path.dirname(indexFile).replace(path.join(process.cwd(), 'src/app/'), '').replace(/\/|\\/g, '-');
//     const className = `Sky${strings.classify(parentDir)}RouteIndexComponent`;
//     const contents = fs.readFileSync(indexFile, { encoding: 'utf-8' });
//     const filePath = path.join(projectDirectory, path.dirname(indexFile).replace(process.cwd(), ''), `${strings.dasherize(parentDir)}-route-index.component.ts`);

//     fs.createFileSync(filePath);
//     fs.writeFileSync(
//       filePath,
//       `import {Component} from '@angular/core';
// @Component({
//   selector: 'app-${strings.dasherize(parentDir)}-route-index',
//   template: \`${contents}\`
// })
// export class ${className} { }\n`
//     );

//     components.push({
//       className,
//       relativePath: filePath.replace(path.join(projectDirectory, 'src/app/'), './'),
//       route: parentDir
//     });
//   });

//   return components;
// }

// function getImportStatement(className, relativePath) {
//   return `import { ${className} } from '${relativePath.replace('.ts', '')}';`
// }

function createSkyPagesModule(projectDirectory, skyuxConfig) {
  const componentFiles = glob.sync(path.join(projectDirectory, 'src/app/**/*.component.ts'), {
    nodir: true,
    ignore: [
      '**/app.component.ts',
      '**/*-route-index.component.ts'
    ]
  });

  const componentNames = componentFiles.map(file => extractComponentName(file));

  const componentImports = componentFiles.map((file, i) => {
    return `import { ${componentNames[i]} } from '${file.replace(path.join(projectDirectory, 'src/app/'), './').replace('.ts', '')}';`;
  });

  const routes = routesGenerator.getRoutes(skyuxConfig);
  const routeComponentImports = routes.imports;
  const routeComponentNames = routes.names;

  // const routeComponents = generateRouteComponents(projectDirectory);
  // const routeComponentImports = routeComponents.map(component => {
  //   return getImportStatement(component.className, component.relativePath);
  // });
  // const routeComponentNames = routeComponents.map(component => component.className);

  // routes.definitions.forEach((definition, i) => {
  //   fs.writeFileSync(path.join(projectDirectory, 'src/app', routes.fileNames[i]), definition);
  // });

  fs.writeFileSync(path.join(projectDirectory, 'src/app/sky-pages.module.ts'), `
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SkyI18nModule } from '@skyux/i18n';
import { SkyAppLinkModule } from '@skyux/router';
${componentImports.join('\n')}
${routeComponentImports.join('\n')}
import { AppExtrasModule } from './app-extras.module';

/**
 * @deprecated This module was migrated from SKY UX Builder v.4.
 * It is highly recommended that this module be factored-out into separate, lazy-loaded feature modules.
 */
@NgModule({
  imports: [
    AppExtrasModule,
    RouterModule,
    SkyAppLinkModule,
    SkyI18nModule
  ],
  declarations: [
    ${componentNames.concat(routeComponentNames).sort().join(',\n    ')}
  ],
  exports: [
    AppExtrasModule,
    ${componentNames.sort().join(',\n    ')}
  ]
})
export class SkyPagesModule { }
`);

  // const routeConfigs = routeComponents.map(c => {
  //   return `  { path: '${c.route}', component: ${c.className} }`;
  // });
  const routeConfigs = [];

  const routingModulePath = path.join(projectDirectory, 'src/app/app-routing.module.ts');
  let appRoutingModuleContents = fs.readFileSync(routingModulePath, { encoding: 'utf-8' });
  appRoutingModuleContents = appRoutingModuleContents.replace('const routes: Routes = [];', `
${routeComponentImports.join('\n')}
const routes: Routes = [
${routeConfigs.join(',\n')}
];`);
  fs.writeFileSync(routingModulePath, appRoutingModuleContents);

  addModuleToMainModuleImports(projectDirectory, 'SkyPagesModule', './sky-pages.module');
}

function modifyPackageJson(projectDirectory) {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  const newPackageJson = fs.readJsonSync(path.join(projectDirectory, 'package.json'));
  const skyuxDependencies = Object.keys(packageJson.dependencies)
    .filter(key => {
      return /@skyux|@blackbaud-internal/.test(key);
    })
    .reduce((obj, key) => {
      obj[key] = packageJson.dependencies[key];
      return obj;
    }, {});

  newPackageJson.dependencies = Object.assign({}, skyuxDependencies, newPackageJson.dependencies);

  fs.writeJsonSync(path.join(projectDirectory, 'package.json'), newPackageJson, { spaces: 2 });
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: projectDirectory
  });
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

  // addAngularBuilder(projectDirectory);
  // addAuthLibraries(projectDirectory);
  copyAssetsDirectory(projectDirectory);
  copyAppFiles(projectDirectory);
  // copyComponents(projectDirectory);
  createSkyPagesModule(projectDirectory, skyuxConfig);
  modifyPackageJson(projectDirectory);

  fs.writeFileSync(
    path.join(projectDirectory, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );

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
