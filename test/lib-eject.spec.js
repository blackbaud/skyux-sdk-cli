const mock = require('mock-require');
const path = require('path');

const CWD = process.cwd();

describe('Eject', () => {
  let ejectedProjectName;
  let ejectedProjectPath;

  let projectDirectoryExists;
  let skyuxConfigExists;
  let notFoundComponentExists;
  let rootIndexHtmlExists;

  let mockSkyuxConfig;
  let actualSkyuxConfig;

  let mockPackageJson;
  let mockEjectedPackageJson;
  let actualEjectedPackageJson;

  let copySyncSpy;
  let errorSpy;
  let processExitSpy;
  let spawnSpy;
  let writeFileSyncSpy;

  let mockComponentData;
  let mockRouteGuardsData;
  let mockRoutesData;

  beforeEach(() => {

    mockRoutesData = {};
    mockRouteGuardsData = {};
    mockComponentData = {
      'src/app/home.component.ts': `@Component({ selector: 'app-home' }) export class HomeComponent {}`
    };

    ejectedProjectName = '';
    ejectedProjectPath = '';

    projectDirectoryExists = false;
    skyuxConfigExists = true;
    notFoundComponentExists = true;
    rootIndexHtmlExists = false;

    mockSkyuxConfig = {
      name: 'skyux-spa-foobar'
    };
    actualSkyuxConfig = undefined;

    mockPackageJson = {};
    mockEjectedPackageJson = {};
    actualEjectedPackageJson = {};

    spawnSpy = jasmine.createSpy('spawnSpy');
    writeFileSyncSpy = jasmine.createSpy('writeFileSync');
    errorSpy = jasmine.createSpy('error').and.callThrough();
    copySyncSpy = jasmine.createSpy('copySync');
    processExitSpy = spyOn(process, 'exit');

    mock('@blackbaud/skyux-logger', {
      error: errorSpy,
      info() {}
    });

    mock('cross-spawn', {
      sync: spawnSpy
    });

    mock('fs-extra', {
      copySync: copySyncSpy,
      createFileSync() {},
      existsSync(file) {
        if (!path.extname(file)) {
          const basename = path.basename(file);
          if (basename === 'assets') {
            return true;
          }

          ejectedProjectPath = file;
          ejectedProjectName = basename;
          return projectDirectoryExists;
        }

        if (file === path.join(CWD, 'skyuxconfig.json')) {
          return skyuxConfigExists;
        }

        if (file === path.join(CWD, 'src/app/not-found.component.ts')) {
          return notFoundComponentExists;
        }

        if (file === path.join(CWD, 'src/app/index.html')) {
          return rootIndexHtmlExists;
        }

        return true;
      },
      readFileSync(file) {
        if (file === path.join(ejectedProjectPath, 'src/app/app.module.ts')) {
          return '@NgModule({}) export class AppModule {}';
        }

        const foundRouteGuard = Object.keys(mockRouteGuardsData).find(x => x === file);
        if (foundRouteGuard) {
          return mockRouteGuardsData[foundRouteGuard];
        }

        const foundComponent = Object.keys(mockComponentData).find(x => x === file);
        if (foundComponent) {
          return mockComponentData[foundComponent];
        }

        return '';
      },
      readJsonSync(file) {
        if (file === path.join(CWD, 'skyuxconfig.json')) {
          return mockSkyuxConfig;
        }

        console.log('file?', file, path.join(CWD, 'package.json'), path.join(ejectedProjectPath, 'package.json'));

        if (file === path.join(ejectedProjectPath, 'package.json')) {
          console.log('found ejected!', mockEjectedPackageJson);
          return mockEjectedPackageJson;
        }

        if (file === path.join(CWD, 'package.json')) {
          console.log('found!', mockPackageJson);
          return mockPackageJson;
        }

        return {};
      },
      writeFileSync: writeFileSyncSpy,
      writeJsonSync(file, contents) {
        file = file.replace(CWD, '');
        if (file.indexOf('skyuxconfig.json') > -1) {
          actualSkyuxConfig = contents;
        }
        if (file.indexOf('package.json') > -1) {
          actualEjectedPackageJson = contents;
        }
      }
    });

    mock('glob', {
      sync(pattern) {
        switch (pattern) {
          case 'skyuxconfig?(.*).json':
            return [path.join(CWD, 'skyuxconfig.json')];
          case path.join(CWD, 'src/app/**/*'):
            return [
              path.join(CWD, 'src/app/home.component.ts')
            ];
          case 'src/app/**/index.html':
            return Object.keys(mockRoutesData);
          case 'src/app/**/index.guard.ts':
            return Object.keys(mockRouteGuardsData);
          case path.join(ejectedProjectPath, 'src/app/**/*.component.ts'):
            return Object.keys(mockComponentData);
        }

        return [];
      }
    });

    mock('../lib/utils/cli-version', {
      verifyLatestVersion() {
        return Promise.resolve();
      }
    });

    mock('../lib/app-dependencies', {
      upgradeDependencies(dependencies) {
        return Promise.resolve(dependencies);
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should throw an error if skyuxconfig.json not found', async () => {
    const eject = mock.reRequire('../lib/eject');
    skyuxConfigExists = false;
    await eject();
    expect(errorSpy).toHaveBeenCalledWith(
      '[skyux eject] Error: A skyuxconfig.json file was not found. Please execute this command within a SKY UX project.'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should derive ejected directory name', async () => {
    const eject = mock.reRequire('../lib/eject');
    mockSkyuxConfig = {}; // no `name` value; use directory name instead.
    await eject();
    const currentDirectory = path.basename(CWD);
    expect(ejectedProjectName).toEqual(currentDirectory);
  });

  it('should run `ng new`', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      ['new', ejectedProjectName, '--legacy-browsers', '--routing', '--strict', '--style=scss'],
      {
        stdio: 'inherit'
      }
    );
  });

  it('should throw an error if new project directory already exists', async () => {
    const eject = mock.reRequire('../lib/eject');

    projectDirectoryExists = true;
    await eject();

    expect(errorSpy).toHaveBeenCalledWith(
      `[skyux eject] Error: The '${ejectedProjectPath}' directory already exists. Delete the directory and rerun the "eject" command.`
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should process basic skyuxconfig.json files', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(actualSkyuxConfig).toEqual({
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json'
    });
  });

  it('should migrate only accepted properties skyuxconfig.json files', async () => {
    const eject = mock.reRequire('../lib/eject');

    mockSkyuxConfig = {
      name: 'skyux-spa-foobar',
      app: {
        externals: {
          js: {
            before: {
              url: 'script.js'
            }
          }
        }
      },
      host: {
        url: 'https://foo.blackbaud.com/'
      },
      params: {
        foo: {
          required: true
        }
      },
      codeCoverageThreshold: 'standard',
      invalidProp: {} // <-- should not be included
    };

    await eject();

    expect(actualSkyuxConfig).toEqual({
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json',
      app: {
        externals: {
          js: {
            before: {
              url: 'script.js'
            }
          }
        }
      },
      host: {
        url: 'https://foo.blackbaud.com/'
      },
      params: {
        foo: {
          required: true
        }
      },
      codeCoverageThreshold: 'standard'
    });
  });

  it('should setup `@skyux-sdk/angular-builders`', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      ['add', '@skyux-sdk/angular-builders'],
      {
        stdio: 'inherit',
        cwd: ejectedProjectPath
      }
    );
  });

  fit('should add SKY UX packages to package.json', async () => {
    const eject = mock.reRequire('../lib/eject');

    mockPackageJson = {
      dependencies: {
        '@angular/core': '9',
        '@blackbaud-internal/skyux-lib-analytics': '4',
        '@blackbaud/skyux-lib-stache': '4',
        '@skyux/core': '4',
        'ignored-dep': '1',
        '@skyux-sdk/ignore-me': '4'
      }
    };

    mockEjectedPackageJson = {
      dependencies: {
        '@angular/core': '11'
      }
    };

    await eject();
    expect(actualEjectedPackageJson).toEqual({
      dependencies: {
        '@angular/core': '11',
        '@blackbaud-internal/skyux-lib-analytics': '4',
        '@blackbaud/skyux-lib-stache': '4',
        '@skyux/core': '4'
      }
    });
  });

  it('should copy assets folder', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(CWD, 'src/assets'),
      path.join(ejectedProjectPath, 'src/assets')
    );
  });

  it('should copy specific app files', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(CWD, 'src/app/home.component.ts'),
      path.join(ejectedProjectPath, 'src/app/home.component.ts')
    );
  });

  it('should handle migrating SPAs without routes', async () => {
    const eject = mock.reRequire('../lib/eject');

    rootIndexHtmlExists = false;
    mockRouteGuardsData = {};
    mockRoutesData = {};

    await eject();

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app-routing.module.ts'),
      `import {
  NgModule
} from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  RootRouteIndexComponent
} from './index.component';

import {
  NotFoundComponent
} from './not-found.component';

const routes: Routes = [
  { path: '', component: RootRouteIndexComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`);
  });

  it('should migrate complex routes', async () => {
    const eject = mock.reRequire('../lib/eject');

    rootIndexHtmlExists = true;

    mockRoutesData = {
      'src/app/about/#contact/#contributors/index.html': '',
      'src/app/about/#contact/#form/index.html': '',
      'src/app/about/#contact/index.html': '',
      'src/app/about/careers/index.html': '',
      'src/app/about/index.html': '<app-about></app-about>',
      'src/app/users/_userId/index.html': '',
      'src/app/users/_userId/locations/_locationId/index.html': '',
      'src/app/users/_userId/locations/index.html': '',
      'src/app/users/index.html': ''
    };

    mockRouteGuardsData = {
      'src/app/users/index.guard.ts': `@Injectable()
  export class MyRouteGuard implements CanActivate {
    public canActivate(): Promise<boolean> {
      return Promise.resolve(false);
    }
    public canActivateChild() {}
    public canDeactivate() {}
  }`
    };

    mockSkyuxConfig.redirects = {
      '': 'new-root',
      foobar: 'about'
    };

    await eject();

    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app-routing.module.ts'),
      `import {
  NgModule
} from '@angular/core';

import {
  RouterModule,
  Routes
} from '@angular/router';

import {
  AboutContactContributorsRouteIndexComponent
} from './about/#contact/#contributors/index.component';

import {
  AboutContactFormRouteIndexComponent
} from './about/#contact/#form/index.component';

import {
  AboutContactRouteIndexComponent
} from './about/#contact/index.component';

import {
  AboutCareersRouteIndexComponent
} from './about/careers/index.component';

import {
  AboutRouteIndexComponent
} from './about/index.component';

import {
  UsersUserIdRouteIndexComponent
} from './users/_userId/index.component';

import {
  UsersUserIdLocationsLocationIdRouteIndexComponent
} from './users/_userId/locations/_locationId/index.component';

import {
  UsersUserIdLocationsRouteIndexComponent
} from './users/_userId/locations/index.component';

import {
  UsersRouteIndexComponent
} from './users/index.component';

import {
  RootRouteIndexComponent
} from './index.component';

import {
  NotFoundComponent
} from './not-found.component';

import {
  MyRouteGuard
} from './users/index.guard';

const routes: Routes = [
  { path: '', redirectTo: 'new-root', pathMatch: 'full' },
  { path: 'foobar', redirectTo: 'about', pathMatch: 'prefix' },
  { path: '', component: RootRouteIndexComponent, children: [
    { path: 'about/careers', component: AboutCareersRouteIndexComponent },
    { path: 'about', component: AboutRouteIndexComponent, children: [
      { path: 'about/contact', component: AboutContactRouteIndexComponent, children: [
        { path: 'about/contact/form', component: AboutContactFormRouteIndexComponent },
        { path: 'about/contact/contributors', component: AboutContactContributorsRouteIndexComponent }
      ] }
    ] },
    { path: 'users/:userId', component: UsersUserIdRouteIndexComponent },
    { path: 'users/:userId/locations/:locationId', component: UsersUserIdLocationsLocationIdRouteIndexComponent },
    { path: 'users/:userId/locations', component: UsersUserIdLocationsRouteIndexComponent },
    { path: 'users', component: UsersRouteIndexComponent, canActivate: [MyRouteGuard], canActivateChild: [MyRouteGuard], canDeactivate: [MyRouteGuard] }
  ] },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
`
    );
  });

  it('should modify the app.component.html file', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app.component.html'),
      `<router-outlet></router-outlet>`
    );
  });

  it('should create the SkyPagesModule', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/sky-pages.module.ts'),
      `import {
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

import {
  HomeComponent
} from 'src/app/home.component';

import {
  RootRouteIndexComponent
} from './index.component';

import {
  NotFoundComponent
} from './not-found.component';

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
    HomeComponent,
    NotFoundComponent,
    RootRouteIndexComponent
  ],
  exports: [
    AppExtrasModule,
    HomeComponent,
    NotFoundComponent,
    RootRouteIndexComponent
  ]
})
export class SkyPagesModule { }
`
    );
  });

  it('should create a NotFoundComponent if not exists', async () => {
    const eject = mock.reRequire('../lib/eject');
    notFoundComponentExists = false;
    await eject();
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/not-found.component.ts'),
      `import {
  Component
} from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html'
})
export class NotFoundComponent { }
`
    );
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/not-found.component.html'),
      `<iframe
  src="https://app.blackbaud.com/errors/notfound"
  style="border:0;height:100vh;width:100%;"
  [title]="'skyux_page_not_found_iframe_title' | skyAppResources"
></iframe>
`
    );
  });

});
