const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Create Angular Workspace', () => {

  let crossSpawnSpy;

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

    crossSpawnSpy = jasmine.createSpy('crossSpawn');
    mock('cross-spawn', {
      sync: crossSpawnSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function verifySpawn() {
    const createAngularWorkspace = mock.reRequire('../lib/utils/eject/libraries/create-angular-workspace');
    createAngularWorkspace(mockEjectedProjectPath, mockWorkspaceName, mockStrictMode);
    expect(crossSpawnSpy).toHaveBeenCalledOnceWith(
      'ng',
      [
        'new', 'my-lib-workspace',
        '--create-application=false',
        '--directory=ejected-path',
        `--strict=${mockStrictMode}`
      ],
      {
        stdio: 'inherit'
      }
    );
  }

  it('should create an empty workspace using Angular CLI', () => {
    verifySpawn();
  });

  it('should respect strict mode', () => {
    mockStrictMode = true;
    verifySpawn();
  });

});
