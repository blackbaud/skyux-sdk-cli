const mock = require('mock-require');

describe('Migrate', function () {
  let buildToolMetadataSpy;
  let jsonUtilsMock;
  let loggerMock;
  let loggerWarnSpy;
  let mockBuildToolMetadata;
  let processExitSpy;

  beforeEach(() => {
    loggerWarnSpy = jasmine.createSpy('loggerWarn');

    loggerMock = {
      logLevel: undefined,
      error() {},
      info: jasmine.createSpy('info'),
      warn: loggerWarnSpy
    };

    jsonUtilsMock = {
      readJson: () => Promise.resolve({}),
      writeJson: () => Promise.resolve()
    };

    processExitSpy = spyOn(process, 'exit');

    mockBuildToolMetadata = {
      name: '@skyux-sdk/builder',
      currentlyInstalledMajorVersion: 3
    };

    buildToolMetadataSpy = jasmine
      .createSpy('getBuildToolMetadata')
      .and.callFake(() => {
        return Promise.resolve(mockBuildToolMetadata);
      });

    mock('@blackbaud/skyux-logger', loggerMock);

    mock('../lib/utils/cli-version', {
      verifyLatestVersion: () => Promise.resolve()
    });

    mock('../lib/utils/get-build-tool-metadata', buildToolMetadataSpy);

    mock('../lib/utils/json-utils', jsonUtilsMock);

    mock('../lib/utils/pact', {
      validateDependencies: (p) => Promise.resolve(p)
    });

    mock('../lib/utils/skyux-config', {
      validateSkyUxConfigJson: () => Promise.resolve()
    });

    mock('../lib/utils/skyux-libraries', {
      fixEntryPoints: () => Promise.resolve(),
      validatePackageJson: (p) => p
    });

    mock('../lib/utils/stylesheets', {
      fixSassDeep: () => Promise.resolve()
    });

    mock('../lib/cleanup', {
      deleteDependencies: () => Promise.resolve()
    });

    mock('../lib/upgrade', () => Promise.resolve());
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should remove deprecated and unsupported packages', async (done) => {
    spyOn(jsonUtilsMock, 'readJson').and.returnValue({
      dependencies: {
        'core-js': '*',
        'intl-tel-input': '*',
        'microedge-rxstate': '*',
        foo: '*',
        tslib: '*'
      },
      devDependencies: {
        '@angular/http': '*',
        '@blackbaud/help-client': '*',
        '@blackbaud/skyux-lib-help': '*',
        '@blackbaud/skyux-lib-testing': '*',
        '@skyux-sdk/builder-plugin-pact': '*',
        '@skyux-sdk/builder': '*',
        '@skyux-sdk/cli': '*',
        '@skyux-sdk/pact': '*',
        bar: '*'
      },
      peerDependencies: {
        '@pact-foundation/node': '*',
        '@types/core-js': '*',
        '@types/node': '*',
        'rxjs-compat': '*',
        baz: '*'
      }
    });
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});
    expect(writeSpy).toHaveBeenCalledWith('package.json', {
      dependencies: {
        foo: '*'
      },
      devDependencies: {
        '@skyux-sdk/builder': '^4.0.0-rc.0',
        bar: '*'
      },
      peerDependencies: {
        baz: '*'
      }
    });
    done();
  });

  it('should remove the `engines` property from package.json', async (done) => {
    spyOn(jsonUtilsMock, 'readJson').and.returnValue({
      engines: {
        node: '10'
      }
    });
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});
    expect(writeSpy).toHaveBeenCalledWith('package.json', {});
    done();
  });

  it('should upgrade the version of `@skyux-sdk/builder` in package.json', async (done) => {
    spyOn(jsonUtilsMock, 'readJson').and.returnValue({
      devDependencies: {
        '@skyux-sdk/builder': '3.0.0'
      }
    });
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});
    expect(writeSpy).toHaveBeenCalledWith('package.json', {
      devDependencies: {
        '@skyux-sdk/builder': '^4.0.0-rc.0'
      }
    });
    done();
  });

  it('should handle missing dependency regions', async (done) => {
    spyOn(jsonUtilsMock, 'readJson').and.returnValue({});
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();
    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});
    expect(writeSpy).toHaveBeenCalledWith('package.json', {});
    done();
  });

  it('should handle errors', async (done) => {
    spyOn(jsonUtilsMock, 'readJson').and.throwError('Something bad happened.');

    const loggerSpy = spyOn(loggerMock, 'error').and.callThrough();

    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});

    expect(loggerSpy).toHaveBeenCalledWith('Error: Something bad happened.');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    done();
  });

  it('should abort if not running against @skyux-sdk/builder@3', async (done) => {
    mockBuildToolMetadata.currentlyInstalledMajorVersion = 4;

    const migrate = mock.reRequire('../lib/migrate');
    await migrate({});
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      'Migration aborted. To migrate a SKY UX 4 project to SKY UX 5, run `skyux eject`.'
    );
    done();
  });
});
