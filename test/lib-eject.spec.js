const mock = require('mock-require');
const path = require('path');

const CWD = process.cwd();

describe('Eject', () => {
  let ejectedProjectName;
  let ejectedProjectPath;

  let projectDirectoryExists;
  let skyuxConfigExists;

  let mockSkyuxConfig;
  let actualSkyuxConfig;

  let mockPackageJson;
  let mockEjectedPackageJson;
  let actualEjectedPackageJson;

  let spawnSpy;
  let writeFileSyncSpy;
  let errorSpy;
  let processExitSpy;
  let copySyncSpy;
  // let writeJsonSyncSpy;

  let mockRoutesData = {
    'src/app/about/index.html': '<app-about></app-about>',
    'src/app/about/#contact/index.html': '',
    'src/app/about/#contact/#contributors/index.html': '',
    'src/app/about/careers/index.html': '',
    'src/app/users/index.html': '',
    'src/app/users/_userId/index.html': '',
    'src/app/users/_userId/locations/index.html': '',
    'src/app/users/_userId/locations/_locationId/index.html': ''
  };

  let mockRouteGuardsData = {
    'src/app/users/index.guard.ts': `@Injectable()
export class MyRouteGuard implements CanActivate {
  public canActivate(): Promise<boolean> {
    return Promise.resolve(false);
  }
}`
  };

  beforeEach(() => {

    ejectedProjectName = '';
    ejectedProjectPath = '';

    projectDirectoryExists = false;
    skyuxConfigExists = true;

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
    // writeJsonSyncSpy = jasmine.createSpy('writeJsonSync');

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

        return '';
      },
      readJsonSync(file) {
        if (file === path.join(CWD, 'skyuxconfig.json')) {
          return mockSkyuxConfig;
        }

        if (file === path.join(ejectedProjectPath, 'package.json')) {
          return mockEjectedPackageJson;
        }

        if (file === path.join(CWD, 'package.json')) {
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
      ['new', ejectedProjectName, '--routing', '--strict', '--style=scss'],
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

  it('should add SKY UX packages to package.json', async () => {
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

  it('should create route components', async () => {
    const eject = mock.reRequire('../lib/eject');

    mockSkyuxConfig.redirects = {
      foobar: 'about'
    };

    await eject();
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join(ejectedProjectPath, 'src/app/app-routing.module.ts'),
      `import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AboutRouteIndexComponent } from './about/index.component';
import { AboutContactRouteIndexComponent } from './about/#contact/index.component';
import { AboutContactContributorsRouteIndexComponent } from './about/#contact/#contributors/index.component';
import { AboutCareersRouteIndexComponent } from './about/careers/index.component';
import { UsersRouteIndexComponent } from './users/index.component';
import { UsersUserIdRouteIndexComponent } from './users/_userId/index.component';
import { UsersUserIdLocationsRouteIndexComponent } from './users/_userId/locations/index.component';
import { UsersUserIdLocationsLocationIdRouteIndexComponent } from './users/_userId/locations/_locationId/index.component';
import { NotFoundComponent } from './not-found.component';
import { MyRouteGuard } from './users/index.guard';

const routes: Routes = [
  { path: 'foobar', redirectTo: 'about', pathMatch: 'prefix' },
  { path: '', component: RootRouteIndexComponent, children: [
    { path: 'about', component: AboutRouteIndexComponent, children: [
      { path: 'about/contact', component: AboutContactRouteIndexComponent }
    ] },
    { path: 'about/careers', component: AboutCareersRouteIndexComponent },
    { path: 'users', component: UsersRouteIndexComponent, canActivate: [MyRouteGuard] },
    { path: 'users/:userId', component: UsersUserIdRouteIndexComponent },
    { path: 'users/:userId/locations', component: UsersUserIdLocationsRouteIndexComponent },
    { path: 'users/:userId/locations/:locationId', component: UsersUserIdLocationsLocationIdRouteIndexComponent }
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

  xit('should modify the app.component.html file', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
  });

  xit('should create the SkyPagesModule', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
  });

});
