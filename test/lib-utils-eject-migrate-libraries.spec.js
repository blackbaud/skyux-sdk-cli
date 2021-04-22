const mock = require('mock-require');
const path = require('path');

describe('migrate libraries util', () => {

  let spawnSyncSpy;
  let removeSyncSpy;
  let copySyncSpy;
  let renameSyncSpy;
  let writeJsonSyncSpy;

  let mockPackageJson;
  let mockEjectedPackageJson;

  beforeEach(() => {
    copySyncSpy = jasmine.createSpy('copySync');
    removeSyncSpy = jasmine.createSpy('removeSync');
    renameSyncSpy = jasmine.createSpy('renameSync');
    spawnSyncSpy = jasmine.createSpy('sync');
    writeJsonSyncSpy = jasmine.createSpy('writeJsonSync');

    mockPackageJson = {
      name: '@namespace/packagejson-name'
    };
    mockEjectedPackageJson = {};

    mock('cross-spawn', {
      sync: spawnSyncSpy
    });

    mock('fs-extra', {
      copySync: copySyncSpy,
      readJsonSync(filePath) {
        if (filePath === path.join(process.cwd(), 'package.json')) {
          return mockPackageJson;
        }

        if (filePath === path.join('ejected-path/projects/libraryName/package.json')) {
          return mockEjectedPackageJson;
        }
      },
      removeSync: removeSyncSpy,
      renameSync: renameSyncSpy,
      writeJsonSync: writeJsonSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/migrate-libraries');
  }

  it('should determine the library name from package.json', () => {
    const util = getUtil();
    const name = util.getName();
    expect(name).toEqual('packagejson-name');
  });

  it('should generate an Angular CLI library', () => {
    const util = getUtil();
    util.generateAngularCliProject('ejected/path', 'libraryName')
    expect(spawnSyncSpy).toHaveBeenCalledWith(
      'ng',
      ['generate', 'library', 'libraryName', '--prefix=sky'],
      {
        stdio: 'inherit', cwd: 'ejected/path'
      }
    );
  });

  it('should copy source files', () => {
    const util = getUtil();
    util.copyFiles('src/app/public', 'ejected-path', 'libraryName');
    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join('ejected-path/projects/libraryName/src/lib')
    );
    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join('ejected-path/projects/libraryName/src/public-api.ts')
    );
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join('src/app/public'),
      path.join('ejected-path/projects/libraryName/src')
    );
    expect(renameSyncSpy).toHaveBeenCalledWith(
      path.join('ejected-path/projects/libraryName/src/public_api.ts'),
      path.join('ejected-path/projects/libraryName/src/public-api.ts')
    );
  });

  it('should modify the library package.json', () => {
    mockPackageJson = {
      name: '@namespace/packagejson-name',
      version: '4.1.0',
      peerDependencies: {
        '@angular/core': '^9',
        '@skyux/core': '^4'
      },
      dependencies: {
        'moment': '1'
      }
    };

    mockEjectedPackageJson = {
      'name': 'core-lib',
      'version': '0.0.0',
      'dependencies': {
        'tslib': '^2.0.0'
      },
      'peerDependencies': {
        '@angular/common': '^11.0.0',
        '@angular/core': '^11.0.0'
      }
    }

    const util = getUtil();

    util.modifyPackageJson('ejected-path', 'libraryName');

    expect(writeJsonSyncSpy).toHaveBeenCalledWith(
      'ejected-path/projects/libraryName/package.json',
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
    }

    const util = getUtil();

    util.modifyPackageJson('ejected-path', 'libraryName');

    expect(writeJsonSyncSpy).toHaveBeenCalledWith(
      'ejected-path/projects/libraryName/package.json',
      {
        name: '@namespace/packagejson-name',
        version: '4.1.0'
      },
      { spaces: 2 }
    );
  });

});
