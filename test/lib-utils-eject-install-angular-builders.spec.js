const mock = require('mock-require');

describe('Eject > Install Angular Builders', () => {

  let mockEjectedProjectPath;
  let spawnSpy;

  beforeEach(() => {
    mockEjectedProjectPath = 'MOCK_EJECTED_PATH';

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    spawnSpy = jasmine.createSpy('spawnSpy');
    mock('cross-spawn', {
      sync: spawnSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/install-angular-builders');
  }

  function validateSpawn(packageName) {
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      ['add', packageName],
      {
        stdio: 'inherit',
        cwd: mockEjectedProjectPath
      }
    );
  }

  it('should add `@skyux-sdk/angular-builders` for public projects', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath, false);

    validateSpawn('@skyux-sdk/angular-builders');
  });

  it('should add `@blackbaud-internal/skyux-angular-builders` for private projects', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath, true);

    validateSpawn('@blackbaud-internal/skyux-angular-builders@^5.0.0-alpha.0');
  });

});
