const mock = require('mock-require');
const path = require('path');

fdescribe('Check workspace', () => {
  const buildTool = {
    name: '@blackbaud-internal/skyux-angular-builders'
  };

  let mockAngularJson;

  beforeEach(() => {
    mockAngularJson = {
      projects: {
        'my-app': {
          projectType: 'application',
          architect: {
            build: {
              builder: '@blackbaud-internal/skyux-angular-builders:browser',
              options: {
                tsConfig: 'tsconfig.app.json'
              },
              configurations: {
                production: {
                  outputHashing: 'bundles'
                }
              }
            },
            serve: {
              builder: '@blackbaud-internal/skyux-angular-builders:dev-server'
            },
            test: {
              builder: '@blackbaud-internal/skyux-angular-builders:karma'
            }
          }
        },
        'my-lib': {
          projectType: 'library',
          architect: {
            test: {
              builder: '@blackbaud-internal/skyux-angular-builders:karma'
            }
          }
        }
      },
      defaultProject: 'my-app'
    };

    mock('@blackbaud/skyux-logger', {
      info() {}
    });

    mock('fs-extra', {
      existsSync: () => true,
      readFileSync(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case 'angular.json':
            return JSON.stringify(mockAngularJson);
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/check-workspace/validate-angular-json');
  }

  it('should throw an error if app does not use our builder', async () => {
    mockAngularJson.projects['my-app'].architect.build.builder = '@angular-devkit/build-angular:browser';

    const checkWorkspace = getUtil();
    try {
      await checkWorkspace(buildTool);
      fail('Expected test to fail.');
    } catch (err) {
      expect(err.message).toEqual(
        'The "projects/my-app/architect/build/builder" node ' +
          'in angular.json specifies an unsupported builder "@angular-devkit/build-angular:browser". ' +
          'A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.'
      );
    }
  });

  it('should throw an error if library does not use our builder', async () => {
    mockAngularJson.projects['my-lib'].architect.test.builder = '@angular-devkit/build-angular:karma';

    const checkWorkspace = getUtil();
    try {
      await checkWorkspace(buildTool);
      fail('Expected test to fail.');
    } catch (err) {
      expect(err.message).toEqual(
        'The "projects/my-lib/architect/test/builder" node ' +
          'in angular.json specifies an unsupported builder "@angular-devkit/build-angular:karma". ' +
          'A builder from the "@blackbaud-internal/skyux-angular-builders" package is required.'
      );
    }
  });

  it('should throw an error if build incorrectly sets outputHashing', async () => {
    mockAngularJson.projects['my-app'].architect.build.configurations.production.outputHashing = 'all';

    const checkWorkspace = getUtil();
    try {
      await checkWorkspace(buildTool);
      fail('Expected test to fail.');
    } catch (err) {
      expect(err.message).toEqual(
        'The "projects/my-app/architect/build/configurations/production/outputHashing" node in angular.json is set to "all" but a value of "bundles" is required.'
      );
    }
  });
});
