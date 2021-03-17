const mock = require('mock-require');

describe('Eject', () => {
  const PROJECT_NAME = 'foobar';

  let spawnSpy;

  beforeEach(() => {

    spawnSpy = jasmine.createSpy('spawnSpy');

    mock('@blackbaud/skyux-logger', {
      error() {},
      info() {}
    });

    mock('cross-spawn', {
      sync: spawnSpy
    });

    mock('fs-extra', {
      copySync() {},
      createFileSync() {},
      existsSync(file) {
        file = file.replace(process.cwd(), '');
        if (new RegExp(PROJECT_NAME).test(file)) {
          return false;
        }

        return true;
      },
      readFileSync(file) {
        file = file.replace(process.cwd(), '');
        if (/app\.module\.ts$/.test(file)) {
          return '@NgModule({}) export class AppModule {}';
        }
        return '';
      },
      readJsonSync(file) {
        file = file.replace(process.cwd(), '');

        if (/skyuxconfig\.json$/.test(file)) {
          return {
            name: PROJECT_NAME
          };
        }

        if (/package\.json$/.test(file)) {
          return {
            dependencies: {}
          };
        }

        return {};
      },
      writeFileSync() {},
      writeJsonSync() {}
    });

    mock('glob', {
      sync() {
        return [];
      }
    });

    mock('../lib/utils/cli-version', {
      verifyLatestVersion() {
        return Promise.resolve();
      }
    });

    mock('../lib/app-dependencies', {
      upgradeDependencies() {
        return Promise.resolve();
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should run `ng new`', async () => {
    const eject = mock.reRequire('../lib/eject');
    await eject();
    expect(spawnSpy).toHaveBeenCalledWith(
      'ng',
      ['new', 'foobar', '--routing', '--strict', '--style=scss'],
      {
        stdio: 'inherit'
      }
    );
  });

});
