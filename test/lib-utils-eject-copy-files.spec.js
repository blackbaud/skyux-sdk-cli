const mock = require('mock-require');
const path = require('path');

const CWD = process.cwd();
const EJECTED_PROJECT_PATH = 'ejected-path';

describe('eject utils copy files', () => {

  let copySyncSpy;

  beforeEach(() => {

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    copySyncSpy = jasmine.createSpy('copySync')
    mock('fs-extra', {
      copySync: copySyncSpy,
      existsSync(file) {
        if (!path.extname(file)) {
          const basename = path.basename(file);
          if (basename === 'assets') {
            return true;
          }

          return false;
        }

        return true;
      }
    });

    mock('glob', {
      sync(pattern) {
        switch (pattern) {
          case path.join(CWD, 'src/app/**/*'):
            return [
              path.join(CWD, 'src/app/home.component.ts')
            ];
          default:
            return [];
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/copy-files');
  }

  it('should copy assets folder', () => {
    const util = getUtil();
    util.copyAssetsDirectory(EJECTED_PROJECT_PATH);
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(CWD, 'src/assets'),
      path.join(EJECTED_PROJECT_PATH, 'src/assets')
    );
  });

  it('should copy specific app files', () => {
    const util = getUtil();
    util.copyAppFiles(EJECTED_PROJECT_PATH);
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(CWD, 'src/app/home.component.ts'),
      path.join(EJECTED_PROJECT_PATH, 'src/app/home.component.ts')
    );
  });

  it('should copy root project files', () => {
    const util = getUtil();
    util.copyRootProjectFiles(EJECTED_PROJECT_PATH);
    expect(copySyncSpy).toHaveBeenCalledWith(
      path.join(CWD, 'README.md'),
      path.join(EJECTED_PROJECT_PATH, 'README.md')
    );
  });

});
