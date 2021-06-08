const mock = require('mock-require');
const path = require('path');

describe('installEsLint', () => {
  let installEsLint;
  let mockCrossSpawn;
  let mockJsonUtils;
  let mockLogger;
  let testEslintRc;

  beforeEach(() => {
    testEslintRc = {};

    mockCrossSpawn = jasmine.createSpyObj(
      'cross-spawn',
      ['sync']
    );

    mockLogger = jasmine.createSpyObj(
      'logger',
      ['info']
    );

    mockJsonUtils = jasmine.createSpyObj(
      'json-utils',
      [
        'readJson',
        'writeJson'
      ]
    );

    mockJsonUtils.readJson.and.callFake((filePath) => {
      if (filePath === path.join('foo', '.eslintrc.json')) {
        return Promise.resolve(testEslintRc);
      }
    });

    mockJsonUtils.writeJson.and.returnValue(Promise.resolve());

    mock('cross-spawn', mockCrossSpawn);
    mock('@blackbaud/skyux-logger', mockLogger);
    mock('../lib/utils/json-utils', mockJsonUtils);

    installEsLint = mock.reRequire('../lib/utils/install-eslint');
  });

  it('should install ESLint', async () => {
    mockCrossSpawn.sync.and.returnValue({
      status: 0
    });

    await installEsLint('foo');

    expect(mockJsonUtils.writeJson).toHaveBeenCalledWith(
      path.join('foo', '.eslintrc.json'),
      {
        ignorePatterns: ['src/app/__skyux']
      }
    );

    expect(mockLogger.info).toHaveBeenCalledWith('ESLint configuration updated.');
  });

  it('should extend Prettier rules for all overrides', async () => {
    testEslintRc = {
      overrides: [
        {

          files: ['*.ts'],
          extends: [
            'plugin:@angular-eslint/recommended',
            'plugin:@angular-eslint/template/process-inline-templates'
          ]
        },
        {

          files: ['*.html']
        }
      ]
    };

    mockCrossSpawn.sync.and.returnValue({
      status: 0
    });

    await installEsLint('foo');

    expect(mockJsonUtils.writeJson).toHaveBeenCalledWith(
      path.join('foo', '.eslintrc.json'),
      {
        ignorePatterns: ['src/app/__skyux'],
        overrides: [
          {

            files: ['*.ts'],
            extends: [
              'plugin:@angular-eslint/recommended',
              'plugin:@angular-eslint/template/process-inline-templates',
              'prettier'
            ]
          },
          {

            files: ['*.html'],
            extends: [
              'prettier'
            ]
          }
        ]
      }
    );
  });


  it('should handle errors installing ESLint', async () => {
    mockCrossSpawn.sync.and.returnValue({
      status: 1
    });

    await expectAsync(installEsLint('foo')).toBeRejectedWithError('Failed to add ESLint to project.');
  });


});
