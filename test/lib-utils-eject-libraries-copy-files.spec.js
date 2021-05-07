const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Copy Files', () => {

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

  it('should copy root files', () => {
    getUtil().copyRootFiles(mockEjectedProjectPath, mockProjectDirectory);

    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'README.md'),
      path.join('mock/ejected/path/projects/my-lib/README.md')
    );

    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'CHANGELOG.md'),
      path.join('mock/ejected/path/projects/my-lib/CHANGELOG.md')
    );
  });

});
