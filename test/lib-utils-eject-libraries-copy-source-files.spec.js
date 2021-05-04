const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Copy Source Files', () => {

  let copySyncSpy;
  let removeSyncSpy;
  let renameSyncSpy;

  let mockSourcePath;
  let mockEjectedProjectPath;
  let mockProjectDirectory;

  beforeEach(() => {
    mockSourcePath = path.join('mock/source/path');
    mockEjectedProjectPath = path.join('mock/ejected/path');
    mockProjectDirectory = 'my-lib';

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    copySyncSpy = jasmine.createSpy('copySync');
    removeSyncSpy = jasmine.createSpy('removeSync');
    renameSyncSpy = jasmine.createSpy('renameSync');

    mock('fs-extra', {
      copySync: copySyncSpy,
      removeSync: removeSyncSpy,
      renameSync: renameSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function copySourceFiles() {
    const util = mock.reRequire('../lib/utils/eject/libraries/copy-source-files');
    util(mockSourcePath, mockEjectedProjectPath, mockProjectDirectory);
  }

  it('should copy source files', () => {
    copySourceFiles();

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

});
