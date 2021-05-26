const mock = require('mock-require');
const path = require('path');

const MOCK_EJECTED_PROJECT_PATH = '/mock/ejected/path';
const MOCK_PROJECT_NAME = 'my-spa';

describe('Eject > Setup deprecated TSLint builder', () => {
  let mockAngularJson;
  let mockPackageJson;
  let writeJsonSpy;

  beforeEach(() => {
    mockAngularJson = {
      projects: {
        [MOCK_PROJECT_NAME]: {
          architect: {}
        }
      }
    };

    mockPackageJson = {
      devDependencies: {}
    };

    writeJsonSpy = jasmine.createSpy('writeJsonSync');

    mock('fs-extra', {
      readJsonSync(fileName) {
        if (fileName.endsWith('angular.json')) {
          return mockAngularJson;
        } else {
          return mockPackageJson;
        }
      },
      writeJsonSync: writeJsonSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/eject/setup-deprecated-tslint-builder');
  }

  it('should add necessary dependencies to package.json', () => {
    const setupDeprecatedTsLintBuilder = getUtil();

    setupDeprecatedTsLintBuilder(MOCK_EJECTED_PROJECT_PATH, MOCK_PROJECT_NAME);

    expect(writeJsonSpy).toHaveBeenCalledWith(
      path.join(MOCK_EJECTED_PROJECT_PATH, 'package.json'),
      {
        devDependencies: {
          codelyzer: '^6.0.0',
          tslint: '~6.1.0',
          'tslint-jasmine-rules': '^1.6.1'
        }
      },
      {
        spaces: 2
      }
    );
  });

  it('should add the lint builder to angular.json', () => {
    const setupDeprecatedTsLintBuilder = getUtil();

    setupDeprecatedTsLintBuilder(MOCK_EJECTED_PROJECT_PATH, MOCK_PROJECT_NAME);

    expect(writeJsonSpy).toHaveBeenCalledWith(
      path.join(MOCK_EJECTED_PROJECT_PATH, 'angular.json'),
      {
        projects: {
          [MOCK_PROJECT_NAME]: {
            architect: {
              lint: {
                builder: '@angular-devkit/build-angular:tslint',
                options: {
                  tsConfig: [
                    'tsconfig.app.json',
                    'tsconfig.spec.json'
                  ],
                  exclude: [
                    '**/node_modules/**'
                  ]
                }
              }
            }
          }
        }
      },
      {
        spaces: 2
      }
    );
  });
});
