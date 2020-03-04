const mock = require('mock-require');

describe('Upgrade', () => {
  let jsonUtilsMock;
  let loggerMock;
  let latestVersionMock;
  let cleanupMock;
  let upgrade;

  beforeEach(() => {
    jsonUtilsMock = {
      readJson: jasmine.createSpy('readJson'),
      writeJson: jasmine.createSpy('writeJson')
    };

    loggerMock = {
      info: jasmine.createSpy('info')
    };

    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName, options) => {
      switch (packageName) {
        case '@foo/bar':
          return '12.2.5';
        case '@foo/baz':
          return '4.5.6';
        default:
          return options.version;
      }
    });

    cleanupMock = {
      deleteDependencies: jasmine.createSpy('deleteDependencies')
    };

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('latest-version', latestVersionMock);

    mock('../lib/utils/json-utils', jsonUtilsMock);
    mock('../lib/cleanup', cleanupMock);

    mock.reRequire('../lib/app-dependencies');
    upgrade = mock.reRequire('../lib/upgrade');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should upgrade an application', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {
        '@foo/bar': '12.2.3'
      },
      devDependencies: {
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      }
    });

    await upgrade();

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/bar',
      {
        version: '^12.2.3'
      }
    );

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/baz',
      {
        version: '^4.5.6'
      }
    );

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith(
      'package.json',
      {
        dependencies: {
          '@foo/bar': '12.2.5'
        },
        devDependencies: {
          '@foo/baz': '4.5.6',
          'from-branch': 'foo/bar#branch'
        }
      }
    );

    expect(cleanupMock.deleteDependencies).toHaveBeenCalled();
  });

  it('should use a specific range for TypeScript', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      devDependencies: {
        'typescript': '2.1'
      }
    });

    await upgrade();

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith(
      'package.json',
      {
        devDependencies: {
          'typescript': '~3.6.4'
        }
      }
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      jasmine.stringMatching(/because TypeScript does not support semantic versioning/)
    );
  });

  it('should use a specific range for zone.js', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {
        'zone.js': '0.8.29'
      }
    });

    await upgrade();

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith(
      'package.json',
      {
        dependencies: {
          'zone.js': '~0.10.2'
        }
      }
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      jasmine.stringMatching(/because Angular requires a specific minor version/)
    );
  });

  it('should use a specific range for ts-node', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {
        'ts-node': '1.2.0'
      }
    });

    await upgrade();

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith(
      'package.json',
      {
        dependencies: {
          'ts-node': '~8.6.0'
        }
      }
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      jasmine.stringMatching(/because Angular requires a specific minor version/)
    );
  });

  it('should handle missing dependency section', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      devDependencies: {
        '@foo/bar': '12.2.3'
      }
    });

    await upgrade();

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/bar',
      {
        version: '^12.2.3'
      }
    );

    expect(jsonUtilsMock.writeJson).toHaveBeenCalledWith(
      'package.json',
      {
        devDependencies: {
          '@foo/bar': '12.2.5'
        }
      }
    );
  });
});
