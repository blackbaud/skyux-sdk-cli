const logger = require('@blackbaud/skyux-logger');
const spawn = require('cross-spawn');
const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

const cliVersion = require('./utils/cli-version');
const routesGenerator = require('./utils/routes-generator');

function readFile(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf-8' });
}

function createAngularCliProject(projectName) {
  spawn.sync('ng', [
    'new', projectName,
    '--legacy-browsers',  // Enables support for IE 11
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

  let source = readFile(mainModulePath);
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
  const content = readFile(file);
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

function getIndexComponentSource(indexComponent) {
  const className = indexComponent.className;
  const selector = indexComponent.selector;
  const routeParams = indexComponent.routeParams;

  if (routeParams) {
    let paramsProperties = [];
    let paramsConstructors = [];

    routeParams.sort().forEach(param => {
      paramsProperties.push(`public ${param}: string = '';`);
      paramsConstructors.push(`this.${param} = params.${param};`);
    });

    return `import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Subject
} from 'rxjs';

import {
  takeUntil
} from 'rxjs/operators';

@Component({
  selector: '${selector}',
  templateUrl: './index.component.html'
})
export class ${className} implements OnInit, OnDestroy {

  ${paramsProperties.join('\n\n  ')}

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private route: ActivatedRoute
  ) { }

  public ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(params => {
        ${paramsConstructors.join('\n        ')}
      });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

}
`;
  }

  return `import {
  Component
} from '@angular/core';

@Component({
  selector: '${selector}',
  templateUrl: './index.component.html'
})
export class ${className} { }
`;
}

function getRouteComponentImports(routeComponents) {
  return routeComponents.map(x => {
    return `import { ${x.className} } from '${x.relativeFilePath.replace('src/app/', './').replace('.ts', '')}';`;
  }).concat([`import { NotFoundComponent } from './not-found.component';`]);
}

function createSkyPagesModule(projectDirectory, skyuxConfig) {
  const componentFiles = glob.sync(path.join(projectDirectory, 'src/app/**/*.component.ts'), {
    nodir: true,
    ignore: [
      '**/index.component.ts',
      '**/not-found.component.ts',
      '**/app.component.ts',
      '**/*-route-index.component.ts'
    ]
  });

  const componentNames = componentFiles.map(file => extractComponentName(file)).concat(['NotFoundComponent']);

  const componentImports = componentFiles.map((file, i) => {
    return `import { ${componentNames[i]} } from '${file.replace(path.join(projectDirectory, 'src/app/'), './').replace('.ts', '')}';`;
  });

  const routes = routesGenerator.getRoutes(skyuxConfig);

  routes.routeComponents.forEach(indexComponent => {
    const componentFilePath = path.join(projectDirectory, indexComponent.relativeFilePath);
    if (!fs.existsSync(componentFilePath)) {
      fs.createFileSync(componentFilePath);
    }
    fs.writeFileSync(componentFilePath, getIndexComponentSource(indexComponent));
    fs.copySync(path.join(process.cwd(), indexComponent.templateFilePath), path.join(projectDirectory, indexComponent.relativeFilePath.replace('.ts', '.html')));
  });

  const routeComponentImports = getRouteComponentImports(routes.routeComponents);
  const routeComponentNames = routes.routeComponents.map(x => x.className);

  modifyRoutingModule(projectDirectory, routes);

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

function modifyRoutingModule(projectDirectory, routesMeta) {
  const getConfig = (routes) => {
    const confStrs = [];
    routes.forEach(config => {
      let str = (config.component)
        ? `{ path: '${config.path}', component: ${config.component}`
        : `{ path: '${config.path}', redirectTo: '${config.redirectTo}', pathMatch: '${config.pathMatch}'`;
      if (config.children) {
        const childStrs = getConfig(config.children);
        str += `, children: [${childStrs.join(',\n')}]`;
      }
      if (config.canActivate) {
        str += `, canActivate: [${config.canActivate.join(',')}]`;
      }
      if (config.canActivateChild) {
        str += `, canActivateChild: [${config.canActivateChild.join(',')}]`;
      }
      if (config.canDeactivate) {
        str += `, canDeactivate: [${config.canDeactivate.join(',')}]`;
      }
      str += ' }';
      confStrs.push(str);
    });
    return confStrs;
  };

  const configStrings = getConfig(routesMeta.routesConfig);
  const routeComponentImports = getRouteComponentImports(routesMeta.routeComponents);
  const routeGuardImports = routesMeta.guards.map(guard => {
    return `import { ${guard.className} } from '${guard.fileName.replace('src/app', '.').replace('.ts', '')}';`;
  });

  const contents = `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

${routeComponentImports.join('\n')}
${routeGuardImports.join('\n')}

const routes: Routes = [
  ${configStrings.join(',\n  ')}
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

  addSkyUxAngularBuilder(projectDirectory);
  // addAuthLibraries(projectDirectory);
  copyAssetsDirectory(projectDirectory);
  copyAppFiles(projectDirectory);
  createSkyPagesModule(projectDirectory, skyuxConfig);
  modifyPackageJson(projectDirectory);

  fs.writeFileSync(
    path.join(projectDirectory, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );

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

  // TODO: Fix SkyAppLinkDirective

  // TODO: Add ng-add schematics auth libraries.

  // TODO: Run `ng lint --fix`

  // TODO: Overwrite app.component.ts from SkyPages.

  // TODO: Create not-found component if user didn't provide one.

  // TODO: Create root component if user didn't provide one.

  // TODO: Add styles.
    // --> Should be added by the Angular builder?

  logger.info('Done ejecting Angular CLI application.');
}

module.exports = eject;
