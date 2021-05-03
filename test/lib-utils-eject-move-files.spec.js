const mock = require('mock-require');
const path = require('path');

const MOCK_EJECTED_PROJECT_PATH = '.mockprojectpath';
const MOCK_TEMP_DIR = '.mocktmpdir';

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
      sync(pattern) {
        if (pattern.startsWith(MOCK_EJECTED_PROJECT_PATH)) {
          return [
            path.join(MOCK_EJECTED_PROJECT_PATH, 'src/app/app.component.ts')
          ];
        }

        return [
          path.join(process.cwd(), 'src/app/app.component.ts')
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

  describe('moveEjectedFilesToCwd', () => {
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

  describe('moveSourceFilesToTemp', () => {
    it('should copy original source files from current working directory to temp folder', () => {
      const util = getUtil();

      util.moveSourceFilesToTemp(MOCK_EJECTED_PROJECT_PATH, MOCK_TEMP_DIR);

      expect(copySyncSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), 'src/app/app.component.ts'),
        path.join(process.cwd(), MOCK_TEMP_DIR, 'src/app/app.component.ts')
      );
    });
  });
});
