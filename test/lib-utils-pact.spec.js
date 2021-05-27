const mock = require('mock-require');

describe('Pact utils', function () {
  let testPackageJson;
  let fsExtraMock;
  let jsonUtilsMock;
  let loggerMock;

  beforeEach(() => {
    testPackageJson = {};

    fsExtraMock = {
      pathExists: () => Promise.resolve(true)
    };

    jsonUtilsMock = {
      readJson: () =>
        Promise.resolve({
          pacts: []
        }),
      writeJson: () => Promise.resolve()
    };

    loggerMock = {
      info() {}
    };

    mock('fs-extra', fsExtraMock);
    mock('../lib/utils/json-utils', jsonUtilsMock);
    mock('@blackbaud/skyux-logger', loggerMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should validate Pact package dependencies', async () => {
    const pact = mock.reRequire('../lib/utils/pact');
    const modified = await pact.validateDependencies(testPackageJson);
    expect(modified).toEqual({
      devDependencies: {
        '@skyux-sdk/builder-plugin-pact': '*',
        '@skyux-sdk/pact': '*'
      }
    });
  });

  it('should not add Pact dependencies if no Pact config found', async () => {
    spyOn(fsExtraMock, 'pathExists').and.returnValue(Promise.resolve(false));
    spyOn(jsonUtilsMock, 'readJson').and.returnValue(Promise.resolve({})); // No `pacts` property.
    const pact = mock.reRequire('../lib/utils/pact');
    const modified = await pact.validateDependencies(testPackageJson);
    expect(modified).toEqual({});
  });

  it('should check `pacts` property on skyuxconfig.pact.json file', async () => {
    spyOn(jsonUtilsMock, 'readJson').and.callFake((fileName) => {
      if (fileName === 'skyuxconfig.pact.json') {
        return Promise.resolve({
          pacts: []
        });
      }

      return Promise.resolve({});
    });
    const pact = mock.reRequire('../lib/utils/pact');
    const modified = await pact.validateDependencies(testPackageJson);
    expect(modified).toEqual({
      devDependencies: {
        '@skyux-sdk/builder-plugin-pact': '*',
        '@skyux-sdk/pact': '*'
      }
    });
  });

  describe('validateConfig()', () => {
    it('should migrate `pacts` and add plugin to skyuxconfig.pact.json', async () => {
      spyOn(jsonUtilsMock, 'readJson').and.callFake((fileName) => {
        if (fileName === 'skyuxconfig.json') {
          return Promise.resolve({});
        } else {
          return Promise.resolve({
            pacts: []
          });
        }
      });

      const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
      const pact = mock.reRequire('../lib/utils/pact');

      await pact.validateConfig();

      expect(writeSpy).toHaveBeenCalledWith('skyuxconfig.json', {});
      expect(writeSpy).toHaveBeenCalledWith('skyuxconfig.pact.json', {
        pacts: [],
        plugins: ['@skyux-sdk/builder-plugin-pact']
      });
    });

    it('should create a skyuxconfig.pact.json file if it does not exist', async () => {
      spyOn(fsExtraMock, 'pathExists').and.returnValue(Promise.resolve(false));

      spyOn(jsonUtilsMock, 'readJson').and.callFake((fileName) => {
        if (fileName === 'skyuxconfig.json') {
          return Promise.resolve({
            pacts: []
          });
        } else {
          return Promise.resolve({});
        }
      });

      const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
      const pact = mock.reRequire('../lib/utils/pact');

      await pact.validateConfig();

      expect(writeSpy).toHaveBeenCalledWith('skyuxconfig.pact.json', {});
    });

    it('should abort if Pact config does not exist', async () => {
      spyOn(fsExtraMock, 'pathExists').and.returnValue(Promise.resolve(false));

      spyOn(jsonUtilsMock, 'readJson').and.callFake((fileName) => {
        if (fileName === 'skyuxconfig.json') {
          return Promise.resolve({});
        }
      });

      const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
      const pact = mock.reRequire('../lib/utils/pact');

      await pact.validateConfig();

      expect(writeSpy).not.toHaveBeenCalled();
    });
  });
});
