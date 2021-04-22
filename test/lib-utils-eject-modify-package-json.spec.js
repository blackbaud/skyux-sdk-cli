const path = require('path');
const mock = require('mock-require');

const CWD = process.cwd();

describe('Modify package.json', () => {
  let actualEjectedPackageJson;
  let ejectedProjectPath;
  let mockEjectedPackageJson;
  let mockPackageJson;
  let mockSpawn;
  let modifyPackageJson;
  let upgradeDependenciesSpy;

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    mock('fs-extra', {
      readJsonSync(file) {
        switch(file) {
          case path.join(ejectedProjectPath, 'package.json'):
            return mockEjectedPackageJson;
          case path.join(CWD, 'package.json'):
            return mockPackageJson;
        }

        return {};
      },
    });

    mockSpawn = jasmine.createSpyObj(
      'cross-spawn',
      ['sync']
    );

    mock('cross-spawn', mockSpawn);

    upgradeDependenciesSpy = jasmine.createSpy('upgradeDependencies');

    mock('../lib/app-dependencies', {
      upgradeDependencies: upgradeDependenciesSpy
    });

    mock('../lib/utils/eject/write-json', (file, contents) => {
      if (file.indexOf('package.json') > -1) {
        actualEjectedPackageJson = contents;
      }
    });

    modifyPackageJson = mock.reRequire('../lib/utils/eject/modify-package-json');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should modify package.json', async () => {
    mockPackageJson = {
      dependencies: {
        '@angular/core': '9',
        '@blackbaud-internal/skyux-lib-analytics': '4',
        '@blackbaud/skyux-lib-stache': '4',
        '@skyux/core': '4',
        'third-party-dep': '1',
        '@skyux-sdk/builder': '4'
      },
      devDependencies: {
        '@skyux/foo': '4',
        '@skyux-sdk/testing': '4',
        'third-party-dev-dep': '2'
      }
    };

    mockEjectedPackageJson = {
      dependencies: {
        '@angular/core': '11'
      },
      devDependencies: {
        'tslint': '5'
      }
    };

    upgradeDependenciesSpy.and.callFake((dependencies) => {
      Object.assign(
        dependencies,
        dependencies['@blackbaud-internal/skyux-lib-analytics'] ?
        {
          '@blackbaud-internal/skyux-lib-analytics': '4.1',
          '@blackbaud/skyux-lib-stache': '4.1',
          '@skyux/core': '4.1'
        } :
        {
          '@skyux-sdk/testing': '4.1',
        }
      );
    });

    await modifyPackageJson(ejectedProjectPath);

    expect(actualEjectedPackageJson).toEqual({
      dependencies: {
        '@angular/core': '11',
        '@blackbaud-internal/skyux-lib-analytics': '4.1',
        '@blackbaud/skyux-lib-stache': '4.1',
        '@skyux/core': '4.1',
        '@skyux/foo': '4',
        'third-party-dep': '1'
      },
      devDependencies: {
        '@skyux-sdk/testing': '4.1',
        'third-party-dev-dep': '2',
        'tslint': '5'
      }
    });

    expect(mockSpawn.sync).toHaveBeenCalledWith('npm', ['i'], {
      stdio: 'inherit',
      cwd: ejectedProjectPath
    });
  });

  it('should account for missing dependency sections', async () => {
    mockPackageJson = {};
    mockEjectedPackageJson = {};

    await modifyPackageJson(ejectedProjectPath);

    expect(actualEjectedPackageJson).toEqual({
      dependencies: {},
      devDependencies: {}
    });
  });

  it('should handle package.json files from libraries', async () => {
    mockPackageJson = {
      'peerDependencies': {
        '@angular/common': '^9.1.7',
        '@angular/core': '^9.1.7',
        '@angular/forms': '^9.1.7',
        '@angular/router': '^9.1.7',
        '@skyux/core': '^4.0.0',
        '@skyux/forms': '^4.4.0',
        '@skyux/i18n': '^4.0.0',
        '@skyux/indicators': '^4.0.0'
      },
      'dependencies': {
        'moment': '2.29.1'
      },
      'devDependencies': {
        '@angular/animations': '9.1.13',
        '@angular/common': '9.1.13',
        '@angular/compiler': '9.1.13',
        '@angular/compiler-cli': '9.1.13',
        '@angular/core': '9.1.13',
        '@angular/forms': '9.1.13',
        '@angular/platform-browser': '9.1.13',
        '@angular/platform-browser-dynamic': '9.1.13',
        '@angular/router': '9.1.13',
        '@blackbaud/auth-client': '2.40.0',
        '@blackbaud/skyux-lib-clipboard': '4.0.0',
        '@blackbaud/skyux-lib-code-block': '4.0.1',
        '@blackbaud/skyux-lib-media': '4.0.0',
        '@blackbaud/skyux-lib-restricted-view': '4.2.0',
        '@blackbaud/skyux-lib-stache': '4.2.1',
        '@skyux-sdk/builder': '4.7.1',
        '@skyux-sdk/builder-plugin-skyux': '4.1.4',
        '@skyux-sdk/e2e': '4.0.0',
        '@skyux-sdk/testing': '4.2.3',
        '@skyux/animations': '4.0.1',
        '@skyux/assets': '4.0.1',
        '@skyux/config': '4.2.0',
        '@skyux/core': '4.3.2',
        '@skyux/datetime': '4.7.0',
        '@skyux/docs-tools': '4.8.0',
        '@skyux/forms': '4.14.0',
        '@skyux/http': '4.1.0',
        '@skyux/i18n': '4.0.3',
        '@skyux/indicators': '4.7.1',
        '@skyux/inline-form': '4.1.0',
        '@skyux/layout': '4.3.1',
        '@skyux/lists': '4.5.0',
        '@skyux/lookup': '4.8.2',
        '@skyux/modals': '4.5.1',
        '@skyux/omnibar-interop': '4.0.1',
        '@skyux/popovers': '4.4.0',
        '@skyux/router': '4.0.1',
        '@skyux/tabs': '4.4.1',
        '@skyux/theme': '4.13.2',
        'codelyzer': '5.2.2',
        'rxjs': '6.6.3',
        'ts-node': '8.3.0',
        'tslint': '6.1.3',
        'typescript': '3.8.3',
        'zone.js': '0.10.3'
      }
    };

    mockEjectedPackageJson = {
      dependencies: {
        '@angular/animations': '~11.2.9',
        '@angular/common': '~11.2.9',
        '@angular/compiler': '~11.2.9',
        '@angular/core': '~11.2.9',
        '@angular/forms': '~11.2.9',
        '@angular/platform-browser': '~11.2.9',
        '@angular/platform-browser-dynamic': '~11.2.9',
        '@angular/router': '~11.2.9',
        'rxjs': '~6.6.0',
        'tslib': '^2.0.0',
        'zone.js': '~0.11.3'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '~0.1102.8',
        '@angular/cli': '~11.2.8',
        '@angular/compiler-cli': '~11.2.9',
        '@types/jasmine': '~3.6.0',
        '@types/node': '^12.11.1',
        'codelyzer': '^6.0.0',
        'jasmine-core': '~3.6.0',
        'jasmine-spec-reporter': '~5.0.0',
        'karma': '~6.1.0',
        'karma-chrome-launcher': '~3.1.0',
        'karma-coverage': '~2.0.3',
        'karma-jasmine': '~4.0.0',
        'karma-jasmine-html-reporter': '^1.5.0',
        'protractor': '~7.0.0',
        'ts-node': '~8.3.0',
        'tslint': '~6.1.0',
        'typescript': '~4.1.5'
      }
    };

    upgradeDependenciesSpy.and.callFake(dependencies => dependencies);

    await modifyPackageJson(ejectedProjectPath);

    expect(actualEjectedPackageJson).toEqual({
      dependencies: {
        '@angular/animations': '~11.2.9',
        '@angular/common': '~11.2.9',
        '@angular/compiler': '~11.2.9',
        '@angular/core': '~11.2.9',
        '@angular/forms': '~11.2.9',
        '@angular/platform-browser': '~11.2.9',
        '@angular/platform-browser-dynamic': '~11.2.9',
        '@angular/router': '~11.2.9',
        '@blackbaud/auth-client': '2.40.0',
        '@blackbaud/skyux-lib-clipboard': '4.0.0',
        '@blackbaud/skyux-lib-code-block': '4.0.1',
        '@blackbaud/skyux-lib-media': '4.0.0',
        '@blackbaud/skyux-lib-restricted-view': '4.2.0',
        '@blackbaud/skyux-lib-stache': '4.2.1',
        '@skyux/animations': '4.0.1',
        '@skyux/assets': '4.0.1',
        '@skyux/config': '4.2.0',
        '@skyux/core': '4.3.2',
        '@skyux/datetime': '4.7.0',
        '@skyux/docs-tools': '4.8.0',
        '@skyux/forms': '4.14.0',
        '@skyux/http': '4.1.0',
        '@skyux/i18n': '4.0.3',
        '@skyux/indicators': '4.7.1',
        '@skyux/inline-form': '4.1.0',
        '@skyux/layout': '4.3.1',
        '@skyux/lists': '4.5.0',
        '@skyux/lookup': '4.8.2',
        '@skyux/modals': '4.5.1',
        '@skyux/omnibar-interop': '4.0.1',
        '@skyux/popovers': '4.4.0',
        '@skyux/router': '4.0.1',
        '@skyux/tabs': '4.4.1',
        '@skyux/theme': '4.13.2',
        'moment': '2.29.1',
        'rxjs': '~6.6.0',
        'tslib': '^2.0.0',
        'zone.js': '~0.11.3'
      },
      devDependencies: {
        '@angular-devkit/build-angular': '~0.1102.8',
        '@angular/cli': '~11.2.8',
        '@angular/compiler-cli': '~11.2.9',
        '@skyux-sdk/e2e': '4.0.0',
        '@skyux-sdk/testing': '4.2.3',
        '@types/jasmine': '~3.6.0',
        '@types/node': '^12.11.1',
        'codelyzer': '^6.0.0',
        'jasmine-core': '~3.6.0',
        'jasmine-spec-reporter': '~5.0.0',
        'karma': '~6.1.0',
        'karma-chrome-launcher': '~3.1.0',
        'karma-coverage': '~2.0.3',
        'karma-jasmine': '~4.0.0',
        'karma-jasmine-html-reporter': '^1.5.0',
        'protractor': '~7.0.0',
        'ts-node': '~8.3.0',
        'tslint': '~6.1.0',
        'typescript': '~4.1.5'
      }
    });
  });
});
