const mock = require('mock-require');

describe('Prompt for strict mode', () => {
  let ejectedProjectPath;
  let mockPromptly;
  let mockTsConfig;
  let promptForStrictMode;

  beforeEach(() => {
    ejectedProjectPath = 'foo';
    mockTsConfig = undefined;

    mock('fs-extra', {
      readJsonSync() {
        return mockTsConfig;
      },
    });

    mockPromptly = jasmine.createSpyObj(
      'promptly',
      ['confirm']
    );

    mock('promptly', mockPromptly);

    promptForStrictMode = mock.reRequire('../lib/utils/eject/prompt-for-strict-mode');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should prompt for strict mode if the SPA does not already have strict mode enabled', async () => {
    mockTsConfig = {};

    mockPromptly.confirm.and.returnValue(Promise.resolve(false));

    const strictMode = await promptForStrictMode(ejectedProjectPath);

    expect(mockPromptly.confirm).toHaveBeenCalledWith(
      'Would you like to enable strict mode for your new SPA? ' +
      'Doing so will break everything, so only choose this option ' +
      'if you love to refactor.'
    );

    expect(strictMode).toBeFalse();
  });

  it('should default to strict mode without prompting if the SPA already has strict mode enabled', async () => {
    mockTsConfig = {
      extends: './node_modules/@skyux-sdk/builder/tsconfig.strict'
    };

    const strictMode = await promptForStrictMode(ejectedProjectPath);

    expect(mockPromptly.confirm).not.toHaveBeenCalled();

    expect(strictMode).toBeTrue();
  });
});