const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Copy Files', () => {

  let copySyncSpy;
  let moveSyncSpy;
  let removeSyncSpy;
  let renameSyncSpy;

  let mockSourcePath;
  let mockEjectedProjectPath;
  let mockProjectDirectory;

  let rootFilesExist;

  beforeEach(() => {
    mockSourcePath = path.join('mock/source/path');
    mockEjectedProjectPath = path.join('mock/ejected/path');
    mockProjectDirectory = 'my-lib';

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    rootFilesExist = true;
    copySyncSpy = jasmine.createSpy('copySync');
    moveSyncSpy = jasmine.createSpy('moveSync');
    removeSyncSpy = jasmine.createSpy('removeSync');
    renameSyncSpy = jasmine.createSpy('renameSync');

    mock('fs-extra', {
      copySync: copySyncSpy,
      existsSync() {
        return rootFilesExist;
      },
      moveSync: moveSyncSpy,
      removeSync: removeSyncSpy,
      renameSync: renameSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    const util = mock.reRequire('../lib/utils/eject/libraries/copy-files');
    return util;
  }

  it('should copy source files', () => {
    getUtil().copySourceFiles(mockSourcePath, mockEjectedProjectPath, mockProjectDirectory);

    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join('mock/ejected/path/projects/my-lib/src/lib')
    );
    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join('mock/ejected/path/projects/my-lib/src/public-api.ts')
    );
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join('mock/source/path'),
      path.join('mock/ejected/path/projects/my-lib/src')
    );
    expect(renameSyncSpy).toHaveBeenCalledWith(
      path.join('mock/ejected/path/projects/my-lib/src/public_api.ts'),
      path.join('mock/ejected/path/projects/my-lib/src/public-api.ts')
    );
  });

  it('should handle root files', () => {
    getUtil().copyRootFiles(mockEjectedProjectPath, mockProjectDirectory);

    expect(moveSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'README.md'),
      path.join('mock/ejected/path/projects/my-lib/README.md'),
      {
        overwrite: true
      }
    );

    expect(moveSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'LICENSE'),
      path.join('mock/ejected/path/projects/my-lib/LICENSE'),
      {
        overwrite: true
      }
    );
  });

  it('should handle missing root files', () => {
    rootFilesExist = false;
    getUtil().copyRootFiles(mockEjectedProjectPath, mockProjectDirectory);

    expect(moveSyncSpy).not.toHaveBeenCalled();
  });

});
