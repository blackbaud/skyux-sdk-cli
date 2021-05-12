const mock = require('mock-require');
const path = require('path');

describe('Run lint fix', () => {
  let spawnSyncSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    spawnSyncSpy = jasmine.createSpy('spawnSync');
    mock('cross-spawn', {
      sync: spawnSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should run `ng lint --fix`', () => {
    const runLintFix = mock.reRequire('../lib/utils/eject/run-lint-fix');
    const mockCwd = 'foo/bar/baz';
    runLintFix(mockCwd);
    expect(spawnSyncSpy).toHaveBeenCalledWith('ng', ['lint', '--fix'], {
      cwd: path.join(mockCwd),
      stdio: 'inherit'
    });
  });
});
