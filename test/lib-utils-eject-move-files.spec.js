const mock = require('mock-require');
const path = require('path');

const MOCK_EJECTED_PROJECT_PATH = '.mocktmp';

describe('move files', () => {
  let copySyncSpy;
  let moveSyncSpy;
  let removeSyncSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    copySyncSpy = jasmine.createSpy('copySync');
    moveSyncSpy = jasmine.createSpy('moveSync');
    removeSyncSpy = jasmine.createSpy('removeSync');
    mock('fs-extra', {
      copySync: copySyncSpy,
      moveSync: moveSyncSpy,
      removeSync: removeSyncSpy
    });

    mock('glob', {
      sync() {
        return [
          path.join(MOCK_EJECTED_PROJECT_PATH, 'src/app/app.component.ts')
        ];
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/move-files');
  }

  it('should move files from ejected temp folder to current working directory', () => {
    const util = getUtil();

    util.moveEjectedFilesToCwd(MOCK_EJECTED_PROJECT_PATH);

    expect(moveSyncSpy).toHaveBeenCalledWith(
      path.join(MOCK_EJECTED_PROJECT_PATH, 'src/app/app.component.ts'),
      path.join(process.cwd(), 'src/app/app.component.ts'),
      {
        overwrite: true
      }
    );
  });

  it('should remove directories', () => {
    const util = getUtil();

    util.moveEjectedFilesToCwd(MOCK_EJECTED_PROJECT_PATH);

    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'node_modules')
    );

    expect(removeSyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'src')
    );

    expect(removeSyncSpy).toHaveBeenCalledWith(
      MOCK_EJECTED_PROJECT_PATH
    );
  });

});
