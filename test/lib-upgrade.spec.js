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
      info: jasmine.createSpy('info'),
      error: jasmine.createSpy('error')
    };

    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName) => {
      switch (packageName) {
        case '@foo/bar':
          return '12.2.5';
        case '@foo/baz':
          return '4.5.6';
        case 'typescript':
          return '2.2';
        case 'zone.js':
          return '0.9.0';
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

    spyOn(process, 'exit');
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
        version: '12'
      }
    );

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/baz',
      {
        version: '4'
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

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/bar',
      {
        version: '12'
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

  it('should not upgrade an application but log upgradable dependencies when run with dryrun', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {
        '@foo/bar': '12.2.3'
      }
    });

    await upgrade({ 'dryrun': true });

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/bar',
      {
        version: '12'
      }
    );
    expect(jsonUtilsMock.writeJson).not.toHaveBeenCalled();
    expect(cleanupMock.deleteDependencies).not.toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/This project has out of date depenedencies. Here are the out of date dependencies with their latest versions:/)
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/@foo\/bar can be upgraded to version 12\.2\.5/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should not upgrade an application but log upgradable devDependencies when run with dryrun', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      devDependencies: {
        '@foo/baz': '3.5.6',
        'from-branch': 'foo/bar#branch'
      }
    });

    await upgrade({ 'dryrun': true });

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/baz',
      {
        version: '3'
      }
    );
    expect(jsonUtilsMock.writeJson).not.toHaveBeenCalled();
    expect(cleanupMock.deleteDependencies).not.toHaveBeenCalled();
    expect(loggerMock.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/This project has out of date depenedencies. Here are the out of date dependencies with their latest versions:/)
    );
    expect(loggerMock.error).toHaveBeenCalledWith(
      jasmine.stringMatching(/@foo\/baz can be upgraded to version 4\.5\.6/)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should not upgrade an application and not log anything when run with dryrun and there are no out of date dependencies', async () => {
    jsonUtilsMock.readJson.and.returnValue({
      dependencies: {
        '@foo/bar': '12.2.5'
      },
      devDependencies: {
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      }
    });

    await upgrade({ 'dryrun': true });

    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/bar',
      {
        version: '12'
      }
    );
    expect(latestVersionMock).toHaveBeenCalledWith(
      '@foo/baz',
      {
        version: '4'
      }
    );
    expect(jsonUtilsMock.writeJson).not.toHaveBeenCalled();
    expect(cleanupMock.deleteDependencies).not.toHaveBeenCalled();
    expect(loggerMock.error).not.toHaveBeenCalled();
    expect(process.exit).not.toHaveBeenCalledWith(1);
  });
});
