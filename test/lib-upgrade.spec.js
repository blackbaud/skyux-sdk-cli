const mock = require('mock-require');

describe('Upgrade', () => {
  let appDependenciesMock;
  let appDependenciesV3Mock;
  let jsonUtilsMock;
  let loggerMock;
  let upgrade;
  let npmInstallArgs;
  let npmInstallMock;
  let npmInstallCalled;
  let processExitSpy;
  let latestVersionMock;
  let npmAuditSpy;
  let deleteDependenciesSpy;

  beforeEach(() => {
    appDependenciesMock = {
      async addSkyPeerDependencies() {},
      async upgradeDependencies() {}
    };

    appDependenciesV3Mock = {
      async addSkyPeerDependencies() {},
      async upgradeDependencies() {}
    };

    jsonUtilsMock = {
      readJson: jasmine.createSpy('readJson'),
      writeJson: jasmine.createSpy('writeJson')
    };

    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName, args) => {
      return Promise.resolve(args.version);
    });

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

    processExitSpy = spyOn(process, 'exit');
    npmAuditSpy = jasmine.createSpy('npmAudit');
    deleteDependenciesSpy = jasmine.createSpy('deleteDependencies');

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('latest-version', latestVersionMock);

    mock('../lib/utils/json-utils', jsonUtilsMock);
    mock('../lib/app-dependencies', appDependenciesMock);
    mock('../lib/v3-compat/app-dependencies', appDependenciesV3Mock);
    mock('../lib/utils/npm-install', npmInstallMock);
    mock('../lib/utils/cli-version', {
      verifyLatestVersion: () => Promise.resolve()
    });

    mock('../lib/cleanup', {
      deleteDependencies: deleteDependenciesSpy
    });
    mock('../lib/utils/npm-audit', npmAuditSpy);

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
      '@skyux-sdk/builder': '4.0.0',
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

    const devDependencies = {
      '@skyux-sdk/builder': '4.0.0'
    };

    jsonUtilsMock.readJson.and.returnValue({
      dependencies,
      devDependencies
    });

    await upgrade({
      install: false
    });

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith('package.json', {
      dependencies,
      devDependencies
    });
    expect(npmInstallCalled).toEqual(false);

    done();
  });

  it('should pass stdio: inherit to spawn when logLevel is verbose', async (done) => {
    loggerMock.logLevel = 'verbose';

    const dependencies = {
      '@foo/bar': '12.2.3'
    };

    jsonUtilsMock.readJson.and.returnValue({
      dependencies,
      devDependencies: {
        '@skyux-sdk/builder': '4.0.0'
      }
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
      devDependencies: {
        '@skyux-sdk/builder': '4.0.0'
      }
    });

    const loggerSpy = spyOn(loggerMock, 'error').and.callThrough();

    await upgrade({});

    expect(loggerSpy).toHaveBeenCalledWith('Error: Something bad happened.');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    done();
  });

  it('should be backwards compatible with Builder 3 projects', async (done) => {
    const upgradeDependenciesV3Spy = spyOn(appDependenciesV3Mock, 'upgradeDependencies').and.callThrough();

    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {},
      devDependencies: {
        '@skyux-sdk/builder': '3.0.0' // <-- IMPORTANT
      }
    });

    await upgrade({});

    expect(upgradeDependenciesV3Spy).toHaveBeenCalled();

    done();
  });

  it('should run npm audit with --audit flag', async (done) => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {},
      devDependencies: {
        '@skyux-sdk/builder': '4.0.0'
      }
    });

    await upgrade({
      install: false, // <-- This should be overridden.
      audit: true
    });

    expect(npmAuditSpy).toHaveBeenCalled();
    expect(npmInstallCalled).toBe(true, 'Running an audit should always run install.');

    done();
  });

  it('should run a clean install with --clean flag', async (done) => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {},
      devDependencies: {
        '@skyux-sdk/builder': '4.0.0'
      }
    });

    await upgrade({
      install: false, // <-- This should be overridden.
      audit: false, // <-- This should be overridden.
      clean: true
    });

    expect(npmAuditSpy).toHaveBeenCalled();
    expect(npmInstallCalled).toBe(true, 'Running a clean install should always run install.');
    expect(deleteDependenciesSpy).toHaveBeenCalled();
    done();
  });
});
