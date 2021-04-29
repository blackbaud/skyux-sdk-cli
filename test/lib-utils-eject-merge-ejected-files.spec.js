const mock = require('mock-require');
const path = require('path');

const MOCK_EJECTED_PROJECT_PATH = '.mocktmp';

describe('merge ejected files', () => {
  let copySyncSpy;
  let removeSyncSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    copySyncSpy = jasmine.createSpy('copySync');
    removeSyncSpy = jasmine.createSpy('removeSync');
    mock('fs-extra', {
      copySync: copySyncSpy,
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
    return mock.reRequire('../lib/utils/eject/merge-ejected-files');
  }

  it('should copy files from ejected temp folder to source location', () => {
    const mergeEjectedFiles = getUtil();

    mergeEjectedFiles(MOCK_EJECTED_PROJECT_PATH);

    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(MOCK_EJECTED_PROJECT_PATH, 'src/app/app.component.ts'),
      path.join(process.cwd(), 'src/app/app.component.ts')
    );
  });

  it('should remove directories', () => {
    const mergeEjectedFiles = getUtil();

    mergeEjectedFiles(MOCK_EJECTED_PROJECT_PATH);

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
