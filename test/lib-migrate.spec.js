const mock = require('mock-require');

describe('Migrate', function () {
  let fsExtraMock;
  let latestVersionMock;
  let loggerMock;
  let migrate;

  beforeEach(() => {
    fsExtraMock = {
      copyFile() {
        return Promise.resolve();
      },
      pathExists() {
        return Promise.resolve();
      },
      remove() {
        return Promise.resolve();
      }
    };

    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName) => {
      switch (packageName) {
        default:
          return '1.0.0';
      }
    });

    loggerMock = {
      logLevel: undefined,
      error() {},
      info: jasmine.createSpy('info')
    };

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('fs-extra', fsExtraMock);
    mock('latest-version', latestVersionMock);
    mock('../lib/utils/cli-version', {
      verifyLatestVersion: () => Promise.resolve()
    });
    mock('../lib/utils/icons', {
      migrateIcons: () => Promise.resolve()
    });
    mock('../lib/utils/json-utils', {
      readJson: () => Promise.resolve({}),
      writeJson: () => Promise.resolve()
    });
    mock('../lib/utils/stylesheets', {
      fixSassDeep: () => Promise.resolve()
    });
    mock('../lib/cleanup', {
      deleteDependencies: () => Promise.resolve()
    });
    mock('../lib/upgrade', function () {});

    migrate = mock.reRequire('../lib/migrate');
  });

  afterEach(() => {
    mock.stopAll();
  });

  fit('should', async (done) => {
    await migrate({});
    done();
  });

});