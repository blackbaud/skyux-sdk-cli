const mock = require('mock-require');
const path = require('path');

describe('Run lint fix', () => {
  let runNgCommandSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    runNgCommandSpy = jasmine.createSpy('runNgCommand');

    mock('../lib/utils/run-ng-command', runNgCommandSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should run `ng lint --fix`', () => {
    const runLintFix = mock.reRequire('../lib/utils/eject/run-lint-fix');
    const mockCwd = 'foo/bar/baz';
    runLintFix(mockCwd);
    expect(runNgCommandSpy).toHaveBeenCalledWith('lint', ['--fix'], {
      cwd: path.join(mockCwd),
      stdio: 'inherit'
    });
  });
});
