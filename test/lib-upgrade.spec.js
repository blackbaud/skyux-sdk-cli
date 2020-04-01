const mock = require('mock-require');

describe('Upgrade', () => {
  let appDependenciesMock;
  let jsonUtilsMock;
  let loggerMock;
  let upgrade;
  let npmInstallArgs;
  let npmInstallMock;
  let npmInstallCalled;

  beforeEach(() => {
    appDependenciesMock = {
      async addSkyPeerDependencies() {},
      async upgradeDependencies() {}
    };

    jsonUtilsMock = {
      readJson: jasmine.createSpy('readJson'),
      writeJson: jasmine.createSpy('writeJson')
    };

    npmInstallArgs = {};
    npmInstallCalled = false;
    npmInstallMock = function (args) {
      npmInstallArgs = args;
      npmInstallCalled = true;
    };

    loggerMock = {
      logLevel: undefined,
      error() {},
      info: jasmine.createSpy('info')
    };

    mock('@blackbaud/skyux-logger', loggerMock);

    mock('../lib/utils/json-utils', jsonUtilsMock);
    mock('../lib/app-dependencies', appDependenciesMock);
    mock('../lib/utils/npm-install', npmInstallMock);

    upgrade = mock.reRequire('../lib/upgrade');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should upgrade an application', async (done) => {
    const upgradeDependenciesSpy = spyOn(appDependenciesMock, 'upgradeDependencies').and.callThrough();
    const skyDependenciesSpy = spyOn(appDependenciesMock, 'addSkyPeerDependencies').and.callThrough();

    const dependencies = {
      '@foo/bar': '12.2.3'
    };

    const devDependencies = {
      '@foo/baz': '4.5.6',
      'from-branch': 'foo/bar#branch'
    };

    jsonUtilsMock.readJson.and.returnValue({
      dependencies,
      devDependencies
    });

    await upgrade({});

    expect(upgradeDependenciesSpy).toHaveBeenCalledWith(dependencies);
    expect(upgradeDependenciesSpy).toHaveBeenCalledWith(devDependencies);
    expect(skyDependenciesSpy).toHaveBeenCalledWith(dependencies);
    expect(skyDependenciesSpy).toHaveBeenCalledWith(devDependencies);
    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith('package.json', {
      dependencies,
      devDependencies
    });
    expect(npmInstallCalled).toEqual(true);

    done();
  });

  it('should not run npm install if --no-install provided', async (done) => {
    const dependencies = {
      '@foo/bar': '12.2.3'
    };

    jsonUtilsMock.readJson.and.returnValue({
      dependencies
    });

    await upgrade({
      install: false
    });

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith('package.json', { dependencies });
    expect(npmInstallCalled).toEqual(false);

    done();
  });

  it('should pass stdio: inherit to spawn when logLevel is verbose', async (done) => {
    loggerMock.logLevel = 'verbose';

    const dependencies = {
      '@foo/bar': '12.2.3'
    };

    jsonUtilsMock.readJson.and.returnValue({
      dependencies
    });

    await upgrade({
      install: true
    });

    expect(npmInstallCalled).toEqual(true);
    expect(npmInstallArgs).toEqual({
      stdio: 'inherit'
    });

    done();
  });

  it('should handle errors', async (done) => {
    spyOn(appDependenciesMock, 'upgradeDependencies').and.throwError(
      'Something bad happened.'
    );

    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {},
      devDependencies: {}
    });

    const loggerSpy = spyOn(loggerMock, 'error').and.callThrough();

    await upgrade({});

    expect(loggerSpy).toHaveBeenCalledWith('Error: Something bad happened.');

    done();
  });
});
