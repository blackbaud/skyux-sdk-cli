const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Create Angular Library', () => {

  let crossSpawnSpy;

  let mockEjectedProjectPath;
  let mockProjectName;

  beforeEach(() => {
    mockEjectedProjectPath = path.join('mock/ejected/path');
    mockProjectName = 'my-lib';

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
    const createAngularLibrary = mock.reRequire(
      '../lib/utils/eject/libraries/create-angular-library'
    );
    createAngularLibrary(mockEjectedProjectPath, mockProjectName);
    expect(crossSpawnSpy).toHaveBeenCalledOnceWith(
      'ng',
      [
        'generate', 'library', 'my-lib',
        '--prefix=sky'
      ],
      {
        stdio: 'inherit',
        cwd: mockEjectedProjectPath
      }
    );
  }

  it('should generate a library using Angular CLI', () => {
    verifySpawn();
  });

});
