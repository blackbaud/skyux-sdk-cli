const mock = require('mock-require');
const path = require('path');

const MOCK_EJECTED_PROJECT_PATH = '.mockprojectpath';
const MOCK_TEMP_DIR = '.mocktmpdir';

describe('backup source files', () => {
  let copySyncSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    copySyncSpy = jasmine.createSpy('copySync');
    mock('fs-extra', {
      copySync: copySyncSpy
    });

    mock('glob', {
      sync() {
        return [path.join(process.cwd(), 'src/app/app.component.ts')];
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/backup-source-files');
  }

  it('should copy original source files from current working directory to temp folder', () => {
    const util = getUtil();

    util(MOCK_EJECTED_PROJECT_PATH, MOCK_TEMP_DIR);

    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(process.cwd(), 'src/app/app.component.ts'),
      path.join(process.cwd(), MOCK_TEMP_DIR, 'src/app/app.component.ts')
    );
  });

  it('should work with Windows paths', () => {
    const mockCwd = '\\mock\\current\\working\\directory';
    spyOn(process, 'cwd').and.returnValue(mockCwd);

    const util = getUtil();

    util(MOCK_EJECTED_PROJECT_PATH, MOCK_TEMP_DIR);

    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(mockCwd, 'src/app/app.component.ts'),
      path.join(mockCwd, MOCK_TEMP_DIR, 'src/app/app.component.ts')
    );
  });
});
