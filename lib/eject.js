const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const angularUtils = require('./utils/angular-utils');
const cliVersion = require('./utils/cli-version');
const routesGenerator = require('./utils/routes-generator');
const appDependencies = require('./app-dependencies');

const CWD = process.cwd();

function writeJson(filePath, contents) {
  fs.writeJsonSync(
    filePath,
    contents,
    {
      spaces: 2
    }
  );
}

function createAngularCliProject(projectName) {
  spawn.sync('ng', [
    'new', projectName,
    // '--legacy-browsers',  // Enables support for IE 11
    '--routing',          // Creates a routing module
    '--strict',           // Enables strict mode
    '--style=scss'        // Use scss for stylesheets
  ], {
    stdio: 'inherit'
  });
}

function addSkyUxAngularBuilder(ejectedProjectPath) {
  spawn.sync('ng', ['add', '@skyux-sdk/angular-builders'], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

function copyAssetsDirectory(ejectedProjectPath) {
  logger.info('Copying assets directory...');
  const assetsDirectory = path.join(CWD, 'src/assets');
  /*istanbul ignore else*/
  if (fs.existsSync(assetsDirectory)) {
    fs.copySync(assetsDirectory, path.join(ejectedProjectPath, 'src/assets'));
  }
  logger.info('Done copying assets.');
}

function copyAppFiles(ejectedProjectPath) {
  const files = glob.sync(path.join(CWD, 'src/app/**/*'), {
    nodir: true,
    ignore: [
      '**/index.html',      // Handle index.html files in a different step.
      'src/app/public/**/*' // Don't worry about library files right now.
    ]
  });

  files.forEach(file => {
    fs.copySync(file, path.join(ejectedProjectPath, file.replace(CWD, '')))
  });
}

function createSkyPagesModule(ejectedProjectPath, routes) {
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
    return `import { ${componentNames[i]} } from '${file.replace(path.join(ejectedProjectPath, 'src/app/'), './').replace('.ts', '')}';`;
  });

  const routeComponentImports = routesGenerator.getRouteComponentImports(routes.routeComponents);
  const routeComponentNames = routes.routeComponents.map(x => x.className);

  const contents = `import { CommonModule } from '@angular/common';
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
}

function createRouteComponentFiles(ejectedProjectPath, routes) {
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
}

/**
 * Moves (and upgrades) any SKY UX dependencies to the new Angular CLI package.json file.
 */
async function modifyPackageJson(ejectedProjectPath) {
  const packageJson = fs.readJsonSync(path.join(CWD, 'package.json'));
  const ejectedPackageJson = fs.readJsonSync(path.join(ejectedProjectPath, 'package.json'));

  packageJson.dependencies = packageJson.dependencies || {};
  ejectedPackageJson.dependencies = ejectedPackageJson.dependencies || {};

  const skyuxDependencies = Object.keys(packageJson.dependencies)
    .filter(key => /^(@skyux|@blackbaud|@blackbaud-internal)\//.test(key))
    .reduce((obj, key) => {
      obj[key] = packageJson.dependencies[key];
      return obj;
    }, {});

  await appDependencies.upgradeDependencies(skyuxDependencies);

  const merged = Object.assign({}, skyuxDependencies, ejectedPackageJson.dependencies);
  ejectedPackageJson.dependencies = merged;

  writeJson(
    path.join(ejectedProjectPath, 'package.json'),
    ejectedPackageJson
  );

  // Install the new packages.
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: ejectedProjectPath
  });
}

function modifyRoutingModule(ejectedProjectPath, routes) {
  const configString = routesGenerator.stringifyRoutesConfig(routes.routesConfig);
  const routeComponentImports = routesGenerator.getRouteComponentImports(routes.routeComponents);
  const routeGuardImports = routes.guards.map(guard => {
    const importPath = guard.fileName.replace('src/app', '.').replace('.ts', '');
    return `import { ${guard.className} } from '${importPath}';`;
  });

  const contents = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

${routeComponentImports.join('\n')}
${routeGuardImports.join('\n')}

const routes: Routes = [
  ${configString}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`;

  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app-routing.module.ts'),
    contents
  );
}

function processSkyuxConfigFiles(ejectedProjectPath) {
  const files = glob.sync('skyuxconfig?(.*).json');
  files.forEach(file => {
    const contents = fs.readJsonSync(file);
    const newJson = {
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json'
    };

    if (contents.host) {
      newJson.host = contents.host;
    }

    if (contents.params) {
      newJson.params = contents.params;
    }

    if (contents.codeCoverageThreshold) {
      newJson.codeCoverageThreshold = contents.codeCoverageThreshold;
    }

    if (contents.app && contents.app.externals) {
      newJson.app = {
        externals: contents.app.externals
      };
    }

    writeJson(
      path.join(ejectedProjectPath, file),
      newJson
    );
  });
}

function modifyAppComponent(ejectedProjectPath) {
  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );
}

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

function createNotFoundComponentIfNotExists(ejectedProjectPath) {
  // If the user did not provide their own NotFoundComponent, create one.
  if (!fs.existsSync(path.join(CWD, 'src/app/not-found.component.ts'))) {
    fs.writeFileSync(path.join(ejectedProjectPath, 'src/app/not-found.component.ts'), `import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent { }
`);
    fs.writeFileSync(path.join(ejectedProjectPath, 'src/app/not-found.component.html'), `<iframe
  src="https://app.blackbaud.com/errors/notfound"
  style="border:0;height:100vh;width:100%;"
  [title]="'skyux_page_not_found_iframe_title' | skyAppResources"
></iframe>
`);
    const resourcesJsonPath = path.join(ejectedProjectPath, 'src/assets/locales/resources_en_US.json');
    const resourcesJson = fs.readJsonSync(resourcesJsonPath);
    resourcesJson['skyux_page_not_found_iframe_title'] = {
      message: 'Page not found',
      _description: 'A string value to represent the Page Not Found iframe title attribute.'
    };
    writeJson(resourcesJsonPath, resourcesJson);
  }
}

async function eject() {
  try {
    await cliVersion.verifyLatestVersion();

    const skyuxConfigPath = path.join(CWD, 'skyuxconfig.json');
    if (!fs.existsSync(skyuxConfigPath)) {
      throw new Error(
        'A skyuxconfig.json file was not found. Please execute this command within a SKY UX project.'
      );
    }

    logger.info('Ejecting an Angular CLI application (this might take several minutes)...');

    const skyuxConfig = fs.readJsonSync(skyuxConfigPath);
    const projectName = skyuxConfig.name || path.basename(CWD);
    const ejectedProjectPath = path.join(CWD, projectName);

    if (fs.existsSync(ejectedProjectPath)) {
      throw new Error(`The '${ejectedProjectPath}' directory already exists. Delete the directory and rerun the "eject" command.`);
    }

    // Setup project and packages.
    createAngularCliProject(projectName);
    processSkyuxConfigFiles(ejectedProjectPath);
    addSkyUxAngularBuilder(ejectedProjectPath);
    modifyPackageJson(ejectedProjectPath);

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
    createNotFoundComponentIfNotExists(ejectedProjectPath);
    createSkyPagesModule(ejectedProjectPath, routes);

    // TODO: Run `ng lint --fix`
    // TODO: Overwrite app.component.ts from SkyPages.
    // TODO: Create root component if user didn't provide one.
    // TODO: Add styles.
      // --> Should be added by the Angular builder?

    logger.info('Done ejecting Angular CLI application.');
  } catch (err) {
    logger.error(`[skyux eject] Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = eject;
