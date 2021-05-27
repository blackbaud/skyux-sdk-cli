const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Create Angular Workspace', () => {
  let runNgCommandSpy;

  let mockEjectedProjectPath;
  let mockWorkspaceName;
  let mockStrictMode;

  beforeEach(() => {
    mockEjectedProjectPath = path.join('mock/ejected-path');
    mockWorkspaceName = 'my-lib-workspace';
    mockStrictMode = false;

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    runNgCommandSpy = jasmine.createSpy('runNgCommand');

    mock('../lib/utils/run-ng-command', runNgCommandSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function verifySpawn() {
    const createAngularWorkspace = mock.reRequire(
      '../lib/utils/eject/libraries/create-angular-workspace'
    );
    createAngularWorkspace(
      mockEjectedProjectPath,
      mockWorkspaceName,
      mockStrictMode
    );
    expect(runNgCommandSpy).toHaveBeenCalledOnceWith('new', [
      'my-lib-workspace',
      '--create-application=false',
      '--directory=ejected-path',
      `--strict=${mockStrictMode}`
    ]);
  }

  it('should create an empty workspace using Angular CLI', () => {
    verifySpawn();
  });

  it('should respect strict mode', () => {
    mockStrictMode = true;
    verifySpawn();
  });
});
