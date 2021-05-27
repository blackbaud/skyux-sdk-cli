const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Modify package.json', () => {
  let writeJsonSyncSpy;

  let mockEjectedProjectPath;
  let mockPackageJson;
  let mockEjectedPackageJson;

  beforeEach(() => {
    mockEjectedProjectPath = path.join('mock/ejected/path');

    mockPackageJson = {
      name: '@namespace/packagejson-name'
    };

    mockEjectedPackageJson = {};

    writeJsonSyncSpy = jasmine.createSpy('writeJsonSync');

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    mock('fs-extra', {
      readJsonSync(filePath) {
        if (filePath === path.join(process.cwd(), 'package.json')) {
          return mockPackageJson;
        }

        if (
          filePath ===
          path.join(mockEjectedProjectPath, 'projects/my-lib/package.json')
        ) {
          return mockEjectedPackageJson;
        }
      },
      writeJsonSync: writeJsonSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire(
      '../lib/utils/eject/libraries/modify-library-package-json'
    );
  }

  it('should modify the library package.json', () => {
    mockPackageJson = {
      name: '@namespace/packagejson-name',
      version: '4.1.0',
      peerDependencies: {
        '@angular/core': '^9',
        '@skyux/core': '^4'
      },
      dependencies: {
        moment: '1'
      }
    };

    mockEjectedPackageJson = {
      name: 'core-lib',
      version: '0.0.0',
      dependencies: {
        tslib: '^2.0.0'
      },
      peerDependencies: {
        '@angular/common': '^11.0.0',
        '@angular/core': '^11.0.0'
      }
    };

    const modifyPackageJson = getUtil();
    modifyPackageJson(mockEjectedProjectPath, 'my-lib');

    expect(writeJsonSyncSpy).toHaveBeenCalledWith(
      path.join('mock/ejected/path/projects/my-lib/package.json'),
      {
        name: '@namespace/packagejson-name',
        version: '4.1.0',
        dependencies: {
          tslib: '^2.0.0',
          moment: '1'
        },
        peerDependencies: {
          '@angular/common': '^11.0.0',
          '@angular/core': '^11.0.0',
          '@skyux/core': '^4'
        }
      },
      { spaces: 2 }
    );
  });

  it('should handle missing dependency sections', () => {
    mockPackageJson = {
      name: '@namespace/packagejson-name',
      version: '4.1.0'
    };

    mockEjectedPackageJson = {
      name: 'core-lib',
      version: '0.0.0'
    };

    const modifyPackageJson = getUtil();
    modifyPackageJson(mockEjectedProjectPath, 'my-lib');

    expect(writeJsonSyncSpy).toHaveBeenCalledWith(
      path.join('mock/ejected/path/projects/my-lib/package.json'),
      {
        name: '@namespace/packagejson-name',
        version: '4.1.0'
      },
      { spaces: 2 }
    );
  });
});
