const mock = require('mock-require');
const path = require('path');

const createWorkspaceState = require('../lib/utils/check-workspace/create-workspace-state');

fdescribe('Check workspace > Validate compiler target', () => {
  let mockProject;
  let mockTsconfigAppJson;
  let mockWorkspaceState;

  beforeEach(() => {
    mockProject = {
      projectDefinition: {
        projectType: 'application',
        architect: {
          build: {
            builder: '@blackbaud-internal/skyux-angular-builders:browser',
            options: {
              tsConfig: 'tsconfig.app.json'
            }
          }
        }
      },
      projectName: 'my-app'
    };

    mockWorkspaceState = createWorkspaceState();

    mockTsconfigAppJson = {
      compilerOptions: {
        target: 'es5'
      }
    };

    mock('../lib/utils/jsonc-utils', {
      readJsonC(filePath) {
        const fileName = path.basename(filePath);
        switch (fileName) {
          case 'tsconfig.json':
            return {
              compilerOptions: {
                target: 'ES5'
              }
            };
          case 'tsconfig.app.json':
            return mockTsconfigAppJson;
        }
      }
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  function getUtil() {
    return mock.reRequire('../lib/utils/check-workspace/validate-compiler-target');
  }

  it('should confirm compiler target is set to "es5"', () => {
    const validateCompilerTarget = getUtil();
    validateCompilerTarget(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'The TypeScript compiler target is set to "es5".',
        status: 'passed'
      }
    ]));
  });

  it('should check if compiler target is invalid', () => {
    mockTsconfigAppJson.compilerOptions.target = 'invalid';

    const validateCompilerTarget = getUtil();
    validateCompilerTarget(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'The "/tsconfig.app.json" file specifies an invalid compile target of "invalid". A compiler target of "es5" is required.',
        status: 'failed'
      }
    ]));
  });

  it('should check if compiler target is undefined', () => {
    delete mockTsconfigAppJson.compilerOptions;

    const validateCompilerTarget = getUtil();
    validateCompilerTarget(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'A value for "target" was not defined in the "/tsconfig.app.json" file. A compile target of "es5" is required.',
        status: 'failed'
      }
    ]));
  });

  it('should throw an error if tsconfig not provided in build target', () => {
    delete mockProject.projectDefinition.architect.build.options.tsConfig;

    const validateCompilerTarget = getUtil();
    try {
      validateCompilerTarget(mockProject, mockWorkspaceState);
      fail('Expected test to fail.');
    } catch (err) {
      expect(err.message).toEqual(
        'The "projects/my-app/architect/build/options/tsConfig" node in angular.json is not defined.'
      );
    }
  });

  it('should traverse the "extends" property until a target is found', () => {
    // Delete compiler options for app tsconfig:
    delete mockTsconfigAppJson.compilerOptions;

    // Extend a valid tsconfig.
    mockTsconfigAppJson.extends = 'tsconfig.json';

    const validateCompilerTarget = getUtil();
    validateCompilerTarget(mockProject, mockWorkspaceState);

    expect(mockWorkspaceState.messages).toEqual(jasmine.arrayContaining([
      {
        message: 'The TypeScript compiler target is set to "ES5".',
        status: 'passed'
      }
    ]));
  });
});
