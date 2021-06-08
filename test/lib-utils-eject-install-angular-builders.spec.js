const mock = require('mock-require');

describe('Eject > Install Angular Builders', () => {

  let runNgCommandSpy;

  let mockEjectedProjectPath;
  let mockSpawnStatusCode;

  beforeEach(() => {
    mockEjectedProjectPath = 'MOCK_EJECTED_PATH';
    mockSpawnStatusCode = 0;

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    runNgCommandSpy = jasmine.createSpy('runNgCommand').and.callFake(() => {
      return {
        status: mockSpawnStatusCode
      };
    });

    mock('../lib/utils/run-ng-command', runNgCommandSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/install-angular-builders');
  }

  function validateSpawn(packageName, wasRun = true) {
    let ngRunCommandExpectation = expect(runNgCommandSpy);

    if (!wasRun) {
      ngRunCommandExpectation = ngRunCommandExpectation.not;
    }

    ngRunCommandExpectation.toHaveBeenCalledWith(
      'add',
      [packageName, '--skip-confirmation'],
      {
        stdio: 'inherit',
        cwd: mockEjectedProjectPath
      }
    );
  }

  it('should add `@skyux-sdk/angular-builders` for public projects', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath, false);

    validateSpawn('@skyux-sdk/angular-builders@next');
  });

  it('should add `@blackbaud-internal/skyux-angular-builders` for private projects', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath, true);

    validateSpawn('@blackbaud-internal/skyux-angular-builders@next');
  });

  it('should add `@skyux-sdk/angular-builders-compat` for all projects', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath);

    validateSpawn('@skyux-sdk/angular-builders-compat@next');
  });

  it('should skip adding `@skyux-sdk/angular-builders-compat` when `skipCompat` is true', async () => {
    const installAngularBuilders = getUtil();
    installAngularBuilders(mockEjectedProjectPath, true, true);

    validateSpawn('@skyux-sdk/angular-builders-compat@next', false);
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
          'Failed to add "@blackbaud-internal/skyux-angular-builders@next" to project.'
        )
      );
    }
  });

});
