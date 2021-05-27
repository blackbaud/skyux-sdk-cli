const mock = require('mock-require');

describe('Prompt for strict mode', () => {
  let ejectedProjectPath;
  let mockInquirer;
  let mockTsConfig;
  let promptForStrictMode;

  beforeEach(() => {
    ejectedProjectPath = 'foo';
    mockTsConfig = undefined;

    mock('fs-extra', {
      readJsonSync() {
        return mockTsConfig;
      }
    });

    mockInquirer = jasmine.createSpyObj('inquirer', ['prompt']);

    mock('inquirer', mockInquirer);

    promptForStrictMode = mock.reRequire(
      '../lib/utils/eject/prompt-for-strict-mode'
    );
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should prompt for strict mode if the SPA does not already have strict mode enabled', async () => {
    mockTsConfig = {};

    mockInquirer.prompt.and.returnValue(
      Promise.resolve({
        'strict-confirmation': false
      })
    );

    const strictMode = await promptForStrictMode(ejectedProjectPath);

    expect(mockInquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'confirm',
        name: 'strict-confirmation',
        message:
          'Would you like to enable strict mode for your new Angular project? ' +
          'Doing so will break everything, so only choose this option ' +
          'if you love to refactor.',
        default: false
      }
    ]);

    expect(strictMode).toBeFalse();
  });

  it('should default to strict mode without prompting if the SPA already has strict mode enabled', async () => {
    mockTsConfig = {
      extends: './node_modules/@skyux-sdk/builder/tsconfig.strict'
    };

    const strictMode = await promptForStrictMode(ejectedProjectPath);

    expect(mockInquirer.prompt).not.toHaveBeenCalled();

    expect(strictMode).toBeTrue();
  });
});
