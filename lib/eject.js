const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const angularUtils = require('./utils/angular-utils');
const cliVersion = require('./utils/cli-version');
const gitUtils = require('./utils/git-utils');
const routesGenerator = require('./utils/routes-generator');

const createAngularCliProject = require('./utils/eject/create-angular-cli-project');
const deprecateFiles = require('./utils/eject/deprecate-files');
const ensureNotFoundComponent = require('./utils/eject/ensure-not-found-component');
const migrateLibraries = require('./utils/eject/migrate-libraries');
const migrateSkyuxConfigFiles = require('./utils/eject/migrate-skyux-config-files');
const modifyPackageJson = require('./utils/eject/modify-package-json');
const promptForStrictMode = require('./utils/eject/prompt-for-strict-mode');
const writeJson = require('./utils/eject/write-json');

const CWD = process.cwd();

/**
 * Installs the appropriate Angular builder.
 */
function addSkyUxAngularBuilder(ejectedProjectPath, isInternal) {
  const npmPackage = (isInternal)
    ? '@blackbaud-internal/skyux-angular-builders@^5.0.0-alpha.0'
    : '@skyux-sdk/angular-builders';

  logger.info(`Installing ${npmPackage} ...`);

  spawn.sync('ng', [
    'add', npmPackage
  ], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });

  logger.info('Done.');
}

/**
 * Copies all assets from the existing SKY UX application to the new Angular CLI application.
 */
function copyAssetsDirectory(ejectedProjectPath) {
  logger.info('Copying assets directory...');

  const assetsDirectory = path.join(CWD, 'src/assets');
  /*istanbul ignore else*/
  if (fs.existsSync(assetsDirectory)) {
    fs.copySync(assetsDirectory, path.join(ejectedProjectPath, 'src/assets'));
  }

  logger.info('Done.');
}

/**
 * Copies all source files from the existing SKY UX application to the new Angular CLI application.
 */
function copyAppFiles(ejectedProjectPath) {
  logger.info('Copying app files...');

  const files = glob.sync(path.join(CWD, 'src/app/**/*'), {
    nodir: true,
    ignore: [
      '**/index.html',         // Handle index.html files in a different step.
      '**/src/app/public/**/*' // Don't worry about library files right now.
    ]
  });

  files.forEach(file => {
    fs.copySync(file, path.join(ejectedProjectPath, file.replace(CWD, '')))
  });

  logger.info('Done.');
}

/**
 * Creates a SkyPagesModule, which will handle all of the existing application's routes and component declarations.
 */
function createSkyPagesModule(ejectedProjectPath, routes) {
  logger.info('Creating the SkyPagesModule...');

  const componentFiles = glob.sync(path.join(ejectedProjectPath, 'src/app/**/*.component.ts'), {
    nodir: true,
    ignore: [
      '**/index.component.ts',
      '**/not-found.component.ts',
      '**/app.component.ts',
      '**/*-route-index.component.ts'
    ]
  });

  const componentNames = componentFiles.map(
    file => angularUtils.extractComponentName(file)
  ).concat([
    'RootRouteIndexComponent',
    'NotFoundComponent'
  ]);

  const componentImports = componentFiles.map((file, i) => {
    const importPath = file.replace(path.join(ejectedProjectPath, 'src/app/'), './').replace('.ts', '');
    return `import {
  ${componentNames[i]}
} from '${importPath}';`;
  });

  const routeComponentImports = routesGenerator.getRouteComponentImports(routes.routeComponents);
  const routeComponentNames = routes.routeComponents.map(x => x.className);

  const contents = `import {
  CommonModule
} from '@angular/common';

import {
  NgModule
} from '@angular/core';

import {
  RouterModule
} from '@angular/router';

import {
  SkyI18nModule
} from '@skyux/i18n';

import {
  SkyAppLinkModule
} from '@skyux/router';

${componentImports.join('\n\n')}

${routeComponentImports.join('\n\n')}

import {
  AppExtrasModule
} from './app-extras.module';

/**
 * @deprecated This module was migrated from SKY UX Builder v.4.
 * It is highly recommended that this module be factored-out into separate, lazy-loaded feature modules.
 */
@NgModule({
  imports: [
    AppExtrasModule,
    CommonModule,
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
`;

  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/sky-pages.module.ts'),
    contents
  );

  angularUtils.addModuleToMainModuleImports(
    ejectedProjectPath,
    'SkyPagesModule',
    './sky-pages.module'
  );

  logger.info('Done.');
}

/**
 * Converts existing index.html files into route components.
 */
function createRouteComponentFiles(ejectedProjectPath, routes) {
  logger.info('Creating route component files...');

  routes.routeComponents.forEach(indexComponent => {
    const componentFilePath = path.join(ejectedProjectPath, indexComponent.relativeFilePath);

    /*istanbul ignore if*/
    if (!fs.existsSync(componentFilePath)) {
      fs.createFileSync(componentFilePath);
    }

    fs.writeFileSync(
      componentFilePath,
      routesGenerator.getIndexComponentSource(indexComponent)
    );

    fs.copySync(
      path.join(CWD, indexComponent.templateFilePath),
      path.join(ejectedProjectPath, indexComponent.relativeFilePath.replace('.ts', '.html'))
    );
  });

  logger.info('Done.');
}

/**
 * Makes necessary modifications to the AppRoutingModule.
 */
function modifyRoutingModule(ejectedProjectPath, routes) {
  logger.info('Modifying routing module...');

  const configString = routesGenerator.stringifyRoutesConfig(routes.routesConfig);
  const routeComponentImports = routesGenerator.getRouteComponentImports(routes.routeComponents);
  const routeGuardImports = routes.guards.map(guard => {
    const importPath = guard.fileName.replace('src/app', '.').replace('.ts', '');
    return `import {
  ${guard.className}
} from '${importPath}';`;
  });

  let importStatement = '\n' + routeComponentImports.join('\n\n');
  if (routeGuardImports.length) {
    importStatement += '\n\n' + routeGuardImports.join('\n\n');
  }

  const contents = `import {
  NgModule
} from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';
${importStatement}

const routes: Routes = [
  ${configString}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [${routes.guards.map(x => x.className).join(', ')}]
})
export class AppRoutingModule { }
`;

  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app-routing.module.ts'),
    contents
  );

  logger.info('Done.');
}

/**
 * Makes necessary modifications to the AppComponent.
 */
function modifyAppComponent(ejectedProjectPath) {
  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );
}

/**
 * Creates the RootRouteIndexComponent.
 */
function createRootIndexComponent(ejectedProjectPath) {
  const indexHtml = path.join(CWD, 'src/app/index.html');

  let htmlContents = '<router-outlet></router-outlet>';
  if (fs.existsSync(indexHtml)) {
    htmlContents = fs.readFileSync(indexHtml);
  }

  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/index.component.ts'),
    routesGenerator.getIndexComponentSource({
      className: 'RootRouteIndexComponent',
      selector: 'app-root-route-index'
    })
  );

  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/index.component.html'),
    htmlContents
  );
}

function getEjectedProjectName(skyuxConfig) {
  if (skyuxConfig.app && skyuxConfig.app.base) {
    return skyuxConfig.app.base;
  }

  if (skyuxConfig.name) {
    return skyuxConfig.name;
  }

  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  return packageJson.name.replace(/^blackbaud-skyux-spa-/gi, '');
}

function getSkyuxConfig() {
  const skyuxConfigPath = path.join(CWD, 'skyuxconfig.json');
  if (!fs.existsSync(skyuxConfigPath)) {
    throw new Error(
      'A skyuxconfig.json file was not found. Please execute this command within a SKY UX project.'
    );
  }
  return fs.readJsonSync(skyuxConfigPath);
}

function migrateSkyuxConfigAppStylesArray(skyuxConfig, ejectedProjectPath, projectName) {
  if (skyuxConfig.app && skyuxConfig.app.styles) {
    const angularJsonPath = path.join(ejectedProjectPath, 'angular.json');
    const angularJson = fs.readJsonSync(angularJsonPath);
    const angularStyles = angularJson.projects[projectName].architect.build.options.styles;
    skyuxConfig.app.styles.forEach(filePath => {
      switch (filePath) {
        // Our stylesheets are handled by a different step. Remove them for now.
        case '@skyux/theme/css/sky.css':
        case '@skyux/theme/css/themes/modern/styles.css':
          break;
        default:
          angularStyles.push(filePath);
          break;
      }
    });
    writeJson(angularJsonPath, angularJson);
  }
}

/**
 * Migrates an existing SKY UX application into an Angular CLI application.
 */
async function eject() {
  try {
    await cliVersion.verifyLatestVersion();

    if (gitUtils.checkGitClean()) {
      throw Error('Uncommitted changes found. Please commit or stash any changes before ejecting your project.');
    }

    const skyuxConfig = getSkyuxConfig();
    let projectName = getEjectedProjectName(skyuxConfig);
    const ejectedProjectPath = path.join(CWD, path.basename(CWD));

    if (fs.existsSync(ejectedProjectPath)) {
      throw new Error(`The '${ejectedProjectPath}' directory already exists. Delete the directory and rerun the "eject" command.`);
    }

    const libraryPath = path.join(process.cwd(), 'src/app/public');
    const isLibrary = fs.existsSync(libraryPath);

    // Ensure SPA name and library name are not the same.
    if (isLibrary) {
      projectName += '-spa';
    }

    const gitOriginUrl = gitUtils.getOriginUrl();
    const isInternal = gitOriginUrl.startsWith('https://blackbaud.visualstudio.com/');

    const strictMode = await promptForStrictMode(CWD);

    logger.info('Ejecting an Angular CLI application (this might take several minutes)...');

    // Setup project and packages.
    createAngularCliProject(ejectedProjectPath, projectName, strictMode);
    migrateSkyuxConfigAppStylesArray(skyuxConfig, ejectedProjectPath, projectName);
    migrateSkyuxConfigFiles(ejectedProjectPath, isInternal);

    // Copy files.
    copyAssetsDirectory(ejectedProjectPath);
    copyAppFiles(ejectedProjectPath);

    // Setup routes.
    const routes = routesGenerator.getRoutesData(skyuxConfig);
    createRouteComponentFiles(ejectedProjectPath, routes)
    modifyRoutingModule(ejectedProjectPath, routes);

    // Create additional files.
    modifyAppComponent(ejectedProjectPath);
    createRootIndexComponent(ejectedProjectPath);
    ensureNotFoundComponent(ejectedProjectPath);
    deprecateFiles(ejectedProjectPath);
    createSkyPagesModule(ejectedProjectPath, routes);

    // Migrate library source code, if it exists.
    if (isLibrary) {
      const libraryName = migrateLibraries.getName();
      migrateLibraries.generateAngularCliProject(ejectedProjectPath, libraryName);
      migrateLibraries.copyFiles(libraryPath, ejectedProjectPath, libraryName);
      migrateLibraries.modifyPackageJson(ejectedProjectPath, libraryName);
    }

    // Add the SKY UX Angular builder and update SKY UX dependencies.
    addSkyUxAngularBuilder(ejectedProjectPath, isInternal);
    await modifyPackageJson(ejectedProjectPath);

    logger.info('Done ejecting Angular CLI application.');
  } catch (err) {
    logger.error(`[skyux eject] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = eject;
