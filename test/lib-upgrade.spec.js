const mock = require('mock-require');

describe('Upgrade', () => {
  let jsonUtilsMock;
  let loggerMock;
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

    cleanupMock = {
      deleteDependencies: jasmine.createSpy('deleteDependencies')
    };

    mock('@blackbaud/skyux-logger', loggerMock);

    mock('../lib/json-utils', jsonUtilsMock);
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

  it('should not upgrade TypeScript', async () => {
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
          'typescript': '2.1'
        }
      }
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      jasmine.stringMatching(/This project includes a reference to/)
    );
  });

  it('should not upgrade zone.js', async () => {
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
          'zone.js': '0.8.29'
        }
      }
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      jasmine.stringMatching(/This project includes a reference to/)
    );
  });

  it('should handle missing dependency section', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      devDependencies: {
        '@foo/bar': '12.2.3'
      }
    });

    await upgrade();

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
