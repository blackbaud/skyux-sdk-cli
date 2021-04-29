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
  let publicDirectoryExists;

  let mockAngularJson;
  let actualAngularJson;

  let mockSkyuxConfig;

  let mockPackageJson;

  let createAngularCliProjectSpy;
  let copySyncSpy;
  let deprecateFilesSpy;
  let ensureNotFoundComponentSpy;
  let errorSpy;
  let mergeEjectedFilesSpy;
  let migrateSkyuxConfigFilesSpy;
  let modifyPackageJsonSpy;
  let npmCiSpy;
  let processExitSpy;
  let promptForStrictModeSpy;
  let spawnSpy;
  let writeFileSyncSpy;
  let writeJsonSpy;

  let mockComponentData;
  let mockRouteGuardsData;
  let mockRoutesData;

  let mockOriginUrl;
  let isGitClean;

  let copyAssetsDirectorySpy;
  let copyAppFilesSpy;
  let copyRootProjectFilesSpy;

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
    publicDirectoryExists = false;

    mockAngularJson = {
      projects: {}
    };
    actualAngularJson = undefined;

    mockSkyuxConfig = {
      name: 'skyuxconfig-name'
    };

    mockPackageJson = {
      name: 'packagejson-name'
    };

    spawnSpy = jasmine.createSpy('spawnSpy');
    writeFileSyncSpy = jasmine.createSpy('writeFileSync');
    errorSpy = jasmine.createSpy('error');
    copySyncSpy = jasmine.createSpy('copySync');
    createAngularCliProjectSpy = jasmine.createSpy('createAngularCliProject');
    deprecateFilesSpy = jasmine.createSpy('deprecateFiles');
    ensureNotFoundComponentSpy = jasmine.createSpy('ensureNotFoundComponent');
    migrateSkyuxConfigFilesSpy = jasmine.createSpy('migrateSkyuxConfigFiles');
    modifyPackageJsonSpy = jasmine.createSpy('modifyPackageJson');
    processExitSpy = spyOn(process, 'exit');
    promptForStrictModeSpy = jasmine.createSpy('promptForStrictMode');
    writeJsonSpy = jasmine.createSpy('writeJson');

    // Save the ejected project name.
    createAngularCliProjectSpy.and.callFake((_ejectedProjectPath, projectName) => {
      ejectedProjectName = projectName;
      mockAngularJson = {
        projects: {
          [ejectedProjectName]: {
            architect: {
              build: {
                options: {
                  styles: []
                }
              }
            }
          }
        }
      };
    });

    promptForStrictModeSpy.and.returnValue(Promise.resolve(false));

    spyOn(console, 'error');

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

          if (basename === 'public') {
            return publicDirectoryExists;
          }

          ejectedProjectPath = file;
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
        if (file === path.join(ejectedProjectPath, 'angular.json')) {
          return mockAngularJson;
        }

        if (file === path.join(CWD, 'skyuxconfig.json')) {
          return mockSkyuxConfig;
        }

        if (file === path.join(CWD, 'package.json')) {
          return mockPackageJson;
        }

        return {};
      },
      writeFileSync: writeFileSyncSpy
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

    copyAssetsDirectorySpy = jasmine.createSpy('copyAssetsDirectory');
    copyAppFilesSpy = jasmine.createSpy('copyAppFiles');
    copyRootProjectFilesSpy = jasmine.createSpy('copyRootProjectFiles');
    mock('../lib/utils/eject/copy-files', {
      copyAssetsDirectory: copyAssetsDirectorySpy,
      copyAppFiles: copyAppFilesSpy,
      copyRootProjectFiles: copyRootProjectFilesSpy
    });

    mock('../lib/utils/cli-version', {
      verifyLatestVersion() {
        return Promise.resolve();
      }
    });

    mergeEjectedFilesSpy = jasmine.createSpy('mergeEjectedFiles');
    mock('../lib/utils/eject/merge-ejected-files', mergeEjectedFilesSpy);

    npmCiSpy = jasmine.createSpy('npmCi');
    mock('../lib/utils/npm-ci', npmCiSpy);

    mock('../lib/utils/eject/migrate-libraries', {
      copyFiles() {},
      generateAngularCliProject() {},
      getName() {},
      modifyPackageJson() {}
    });

    mockOriginUrl = 'https://github.com/';
    isGitClean = true;
    mock('../lib/utils/git-utils', {
      getOriginUrl() {
        return mockOriginUrl;
      },
      isGitClean() {
        return isGitClean;
      }
    });

    mock('../lib/app-dependencies', {
      upgradeDependencies(dependencies) {
        return Promise.resolve(dependencies);
      }
    });

    mock('../lib/utils/eject/create-angular-cli-project', createAngularCliProjectSpy);
    mock('../lib/utils/eject/deprecate-files', deprecateFilesSpy);
    mock('../lib/utils/eject/ensure-not-found-component', ensureNotFoundComponentSpy);
    mock('../lib/utils/eject/migrate-skyux-config-files', migrateSkyuxConfigFilesSpy);
    mock('../lib/utils/eject/modify-package-json', modifyPackageJsonSpy);
    mock('../lib/utils/eject/prompt-for-strict-mode', promptForStrictModeSpy);

    writeJsonSpy.and.callFake((file, contents) => {
      if (file.indexOf('angular.json') > -1) {
        actualAngularJson = contents;
      }
    });

    mock('../lib/utils/eject/write-json', writeJsonSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should throw an error if uncommitted changes found', async () => {
    const eject = mock.reRequire('../lib/eject');
    isGitClean = false;
    await eject();
    expect(errorSpy).toHaveBeenCalledWith(
      '[skyux eject] Error: Uncommitted changes found. Please commit or stash any changes before ejecting your project.'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
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

  it('should set project name from skyuxconfig.name', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(ejectedProjectName).toEqual('skyuxconfig-name');
  });

  it('should set project name from skyuxconfig.app.base', async () => {
    const eject = mock.reRequire('../lib/eject');
    mockSkyuxConfig.app = {
      base: 'foobar'
    };
    await eject();
    expect(ejectedProjectName).toEqual('foobar');
  });

  it('should set project name from packageJson.name', async () => {
    const eject = mock.reRequire('../lib/eject');
    mockSkyuxConfig = {};
    await eject();
    expect(ejectedProjectName).toEqual('packagejson-name');
  });

  it('should run `ng new`', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();

    expect(createAngularCliProjectSpy).toHaveBeenCalledWith(ejectedProjectPath, 'skyuxconfig-name', false);
  });

  it('should prompt for strict mode', async () => {
    promptForStrictModeSpy.and.returnValue(Promise.resolve(true));

    const eject = mock.reRequire('../lib/eject');
    await eject();

    expect(promptForStrictModeSpy).toHaveBeenCalledWith(CWD);

    expect(createAngularCliProjectSpy).toHaveBeenCalledWith(ejectedProjectPath, 'skyuxconfig-name', true);
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

  it('should migrate skyuxconfig.app.styles', async () => {
    const eject = mock.reRequire('../lib/eject');
    mockSkyuxConfig.app = {
      styles: [
        'foobar/baz.css',
        '@skyux/theme/css/sky.css',
        '@skyux/theme/css/themes/modern/styles.css'
      ]
    };
    await eject();
    expect(actualAngularJson.projects[ejectedProjectName].architect.build.options.styles).toEqual([
      'foobar/baz.css'
    ]);
  });

  it('should migrate skyuxconfig.json files', async () => {
    const eject = mock.reRequire('../lib/eject');

    await eject();

    expect(migrateSkyuxConfigFilesSpy).toHaveBeenCalledWith(ejectedProjectPath, false);
  });

  it('should add `@skyux-sdk/angular-builders` for public projects', async () => {
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

  it('should add `@blackbaud-internal/skyux-angular-builders` for private projects', async () => {
    mockOriginUrl = 'https://blackbaud.visualstudio.com/';
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      ['add', '@blackbaud-internal/skyux-angular-builders@^5.0.0-alpha.0'],
      {
        stdio: 'inherit',
        cwd: ejectedProjectPath
      }
    );
  });

  it('should update package.json', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();

    expect(modifyPackageJsonSpy).toHaveBeenCalledWith(ejectedProjectPath);
  });

  it('should copy assets folder', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(copyAssetsDirectorySpy).toHaveBeenCalled();
  });

  it('should copy specific app files', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(copyAppFilesSpy).toHaveBeenCalled();
  });

  it('should copy root files', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(copyRootProjectFilesSpy).toHaveBeenCalled();
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
  exports: [RouterModule],
  providers: []
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
  { path: '', component: RootRouteIndexComponent },
  { path: 'about/careers', component: AboutCareersRouteIndexComponent },
  { path: 'about', component: AboutRouteIndexComponent, children: [
    { path: 'contact', component: AboutContactRouteIndexComponent, children: [
      { path: 'form', component: AboutContactFormRouteIndexComponent },
      { path: 'contributors', component: AboutContactContributorsRouteIndexComponent }
    ] }
  ] },
  { path: 'users/:userId', component: UsersUserIdRouteIndexComponent },
  { path: 'users/:userId/locations/:locationId', component: UsersUserIdLocationsLocationIdRouteIndexComponent },
  { path: 'users/:userId/locations', component: UsersUserIdLocationsRouteIndexComponent },
  { path: 'users', component: UsersRouteIndexComponent, canActivate: [MyRouteGuard], canActivateChild: [MyRouteGuard], canDeactivate: [MyRouteGuard] },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [MyRouteGuard]
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
    await eject();

    expect(ensureNotFoundComponentSpy).toHaveBeenCalledWith(ejectedProjectPath);
  });

  it('should mark root modules as deprecated', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(deprecateFilesSpy).toHaveBeenCalledWith(ejectedProjectPath);
  });

  it('should run `npm ci` after eject complete', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(npmCiSpy).toHaveBeenCalled();
  });

  it('should merge ejected files with source files', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(mergeEjectedFilesSpy).toHaveBeenCalled();
  });

  describe('ejecting libraries', () => {
    it('should modify project name if ejecting a library', async () => {
      publicDirectoryExists = true;
      const eject = mock.reRequire('../lib/eject');
      mockSkyuxConfig = {};
      await eject();
      expect(ejectedProjectName).toEqual('packagejson-name-spa');
    });
  });
});
