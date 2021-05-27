const mock = require('mock-require');
const path = require('path');

describe('Eject Libraries > Create Angular Library', () => {
  let runNgCommandSpy;

  let mockEjectedProjectPath;
  let mockProjectName;

  beforeEach(() => {
    mockEjectedProjectPath = path.join('mock/ejected/path');
    mockProjectName = 'my-lib';

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
    const createAngularLibrary = mock.reRequire(
      '../lib/utils/eject/libraries/create-angular-library'
    );
    createAngularLibrary(mockEjectedProjectPath, mockProjectName);
    expect(runNgCommandSpy).toHaveBeenCalledOnceWith(
      'generate',
      ['library', 'my-lib', '--prefix=sky'],
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
