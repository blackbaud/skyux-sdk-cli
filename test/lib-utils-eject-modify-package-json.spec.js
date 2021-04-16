const path = require('path');
const mock = require('mock-require');

const CWD = process.cwd();

describe('Modify package.json', () => {
  let actualEjectedPackageJson;
  let ejectedProjectPath;
  let mockEjectedPackageJson;
  let mockPackageJson;
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
    })

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
      }
    };

    mockEjectedPackageJson = {
      dependencies: {
        '@angular/core': '11'
      }
    };

    upgradeDependenciesSpy.and.callFake((dependencies) => {
      Object.assign(
        dependencies,
        {
          '@blackbaud-internal/skyux-lib-analytics': '4.1',
          '@blackbaud/skyux-lib-stache': '4.1',
          '@skyux/core': '4.1'
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
      }
    });
  });

  it('should account for missing dependency sections', async () => {
    mockPackageJson = {};
    mockEjectedPackageJson = {};

    await modifyPackageJson(ejectedProjectPath);


    expect(actualEjectedPackageJson).toEqual({
      dependencies: {}
    });
  });
});
