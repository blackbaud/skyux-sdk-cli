const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const angularUtils = require('./utils/angular-utils');
const cliVersion = require('./utils/cli-version');
const routesGenerator = require('./utils/routes-generator');
const appDependencies = require('./app-dependencies');

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

function addSkyUxAngularBuilder(projectDirectory) {
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
  const files = glob.sync(path.join(process.cwd(), 'src/app/**/*'), {
    nodir: true,
    ignore: [
      '**/index.html',      // Handle index.html files in a different step.
      'src/app/public/**/*' // Don't worry about library files right now.
    ]
  });

  files.forEach(file => {
    fs.copySync(file, path.join(projectDirectory, file.replace(process.cwd(), '')))
  });
}

function createSkyPagesModule(projectDirectory, routes) {
  const componentFiles = glob.sync(path.join(projectDirectory, 'src/app/**/*.component.ts'), {
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
  ).concat(['NotFoundComponent']);

  const componentImports = componentFiles.map((file, i) => {
    return `import { ${componentNames[i]} } from '${file.replace(path.join(projectDirectory, 'src/app/'), './').replace('.ts', '')}';`;
  });

  const routeComponentImports = routesGenerator.getRouteComponentImports(routes.routeComponents);
  const routeComponentNames = routes.routeComponents.map(x => x.className);

  fs.writeFileSync(path.join(projectDirectory, 'src/app/sky-pages.module.ts'),
`import { CommonModule } from '@angular/common';
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
`);

  angularUtils.addModuleToMainModuleImports(
    projectDirectory,
    'SkyPagesModule',
    './sky-pages.module'
  );
}

function createRouteComponentFiles(projectDirectory, routes) {
  routes.routeComponents.forEach(indexComponent => {
    const componentFilePath = path.join(projectDirectory, indexComponent.relativeFilePath);
    if (!fs.existsSync(componentFilePath)) {
      fs.createFileSync(componentFilePath);
    }
    fs.writeFileSync(componentFilePath, routesGenerator.getIndexComponentSource(indexComponent));
    fs.copySync(path.join(process.cwd(), indexComponent.templateFilePath), path.join(projectDirectory, indexComponent.relativeFilePath.replace('.ts', '.html')));
  });
}

/**
 * Moves (and upgrades) any SKY UX dependencies to the new Angular CLI package.json file.
 */
async function modifyPackageJson(projectDirectory) {
  const packageJson = fs.readJsonSync(path.join(process.cwd(), 'package.json'));
  const newPackageJson = fs.readJsonSync(path.join(projectDirectory, 'package.json'));
  const skyuxDependencies = Object.keys(packageJson.dependencies)
    .filter(key => /@skyux|@blackbaud-internal/.test(key))
    .reduce((obj, key) => {
      obj[key] = packageJson.dependencies[key];
      return obj;
    }, {});

  await appDependencies.upgradeDependencies(skyuxDependencies);

  const merged = Object.assign({}, skyuxDependencies, newPackageJson.dependencies);
  newPackageJson.dependencies = merged;

  fs.writeJsonSync(
    path.join(projectDirectory, 'package.json'),
    newPackageJson,
    {
      spaces: 2
    }
  );

  // Install the new packages.
  spawn.sync('npm', ['i'], {
    stdio: 'inherit',
    cwd: projectDirectory
  });
}

function modifyRoutingModule(projectDirectory, routes) {
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
    path.join(projectDirectory, 'src/app/app-routing.module.ts'),
    contents
  );
}

function processSkyuxConfigFiles(projectDirectory) {
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

    fs.writeJsonSync(path.join(projectDirectory, file), newJson, { spaces: 2 });
  });
}

function modifyAppComponent(projectDirectory) {
  fs.writeFileSync(
    path.join(projectDirectory, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );
}

function createNotFoundComponent(projectDirectory) {
  // If the user did not provide their own NotFoundComponent, create one.
  if (!fs.existsSync(path.join(process.cwd(), 'src/app/not-found.component.ts'))) {
    fs.writeFileSync(path.join(projectDirectory, 'src/app/not-found.component.ts'), `import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent { }
`);
    fs.writeFileSync(path.join(projectDirectory, 'src/app/not-found.component.html'), `<iframe
  src="https://app.blackbaud.com/errors/notfound"
  style="border:0;height:100vh;width:100%;"
  [title]="'skyux_page_not_found_iframe_title' | skyAppResources"
></iframe>
`);
    const resourcesJsonPath = path.join(projectDirectory, 'src/assets/locales/resources_en_US.json');
    const resourcesJson = fs.readJsonSync(resourcesJsonPath);
    resourcesJson['skyux_page_not_found_iframe_title'] = {
      message: 'Page not found',
      _description: 'A string value to represent the Page Not Found iframe title attribute.'
    };
    fs.writeJsonSync(resourcesJsonPath, resourcesJson, { spaces: 2 });
  }
}

async function eject() {
  try {
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

    // Setup project and packages.
    processSkyuxConfigFiles(projectDirectory);
    addSkyUxAngularBuilder(projectDirectory);
    modifyPackageJson(projectDirectory);

    // Copy files.
    copyAssetsDirectory(projectDirectory);
    copyAppFiles(projectDirectory);

    // Setup routes.
    const routes = routesGenerator.getRoutesData(skyuxConfig);
    createRouteComponentFiles(projectDirectory, routes)
    modifyRoutingModule(projectDirectory, routes);

    // Create additional files.
    modifyAppComponent(projectDirectory);
    createNotFoundComponent(projectDirectory);
    createSkyPagesModule(projectDirectory, routes);

    // TODO: Run `ng lint --fix`
    // TODO: Overwrite app.component.ts from SkyPages.
    // TODO: Create root component if user didn't provide one.
    // TODO: Add styles.
      // --> Should be added by the Angular builder?

    logger.info('Done ejecting Angular CLI application.');
  } catch (err) {
    logger.error('The `skyux eject` command has failed with:', err.message);
    process.exit(1);
  }
}

module.exports = eject;
