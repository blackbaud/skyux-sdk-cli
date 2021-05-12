const mock = require('mock-require');

describe('Eject > Install Angular Builders', () => {

  let spawnSpy;

  let mockEjectedProjectPath;
  let mockSpawnStatusCode;

  beforeEach(() => {
    mockEjectedProjectPath = 'MOCK_EJECTED_PATH';
    mockSpawnStatusCode = 0;

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    spawnSpy = jasmine.createSpy('spawnSpy').and.callFake(() => {
      return {
        status: mockSpawnStatusCode
      };
    });

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

    validateSpawn('@blackbaud-internal/skyux-angular-builders@next');
  });

  it('should handle errors', async () => {
    mockSpawnStatusCode = 1;

    const installAngularBuilders = getUtil();

    try {
      installAngularBuilders(mockEjectedProjectPath, true);
      fail('Expected to throw error.');
    } catch (err) {
      expect(err).toEqual(
        new Error(
          'Failed to add @blackbaud-internal/skyux-angular-builders@next to project.'
        )
      );
    }
  });

});
