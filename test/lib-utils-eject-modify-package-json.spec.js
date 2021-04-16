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
        '@skyux-sdk/ignore-me': '4'
      },
      devDependencies: {
        '@skyux/foo': '4',
        '@skyux-sdk/ignore-me-too': '4',
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
          '@skyux/foo': '4.1'
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
        'third-party-dep': '1'
      },
      devDependencies: {
        '@skyux/foo': '4.1',
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
});
