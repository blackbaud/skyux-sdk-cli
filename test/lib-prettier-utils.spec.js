const mock = require('mock-require');
const path = require('path');

describe('prettier utils', () => {
  let prettierUtils;
  let mockCrossSpawn;
  let mockJsonUtils;
  let mockFs;
  let mockLatestVersion;
  let mockLogger;

  beforeEach(() => {
    mockCrossSpawn = jasmine.createSpyObj(
      'cross-spawn',
      ['sync']
    );

    mockFs = jasmine.createSpyObj(
      'fs-extra',
      ['ensureDir']
    );

    mockFs.ensureDir.and.returnValue(Promise.resolve());

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

    mockJsonUtils.writeJson.and.returnValue(Promise.resolve());

    mockLatestVersion = jasmine.createSpy('latestVersion');

    mock('cross-spawn', mockCrossSpawn);
    mock('latest-version', mockLatestVersion);
    mock('@blackbaud/skyux-logger', mockLogger);
    mock('../lib/utils/json-utils', mockJsonUtils);

    prettierUtils = mock.reRequire('../lib/utils/prettier-utils');
  });

  it('should configure Prettier', async () => {
    await prettierUtils.configurePrettier('foo');

    expect(mockJsonUtils.writeJson).toHaveBeenCalledWith(
      path.join('foo/.vscode/settings.json'),
      {
        'editor.defaultFormatter': 'esbenp.prettier-vscode',
        'editor.formatOnSave': true,
        'prettier.requireConfig': true
      }
    );

    expect(mockJsonUtils.writeJson).toHaveBeenCalledWith(
      path.join('foo/.prettierrc'),
      {
        singleQuote: true,
        trailingComma: 'none'
      }
    );
  });

  it('should apply Prettier to files', () => {
    prettierUtils.applyPrettierToFiles('foo');

    expect(mockCrossSpawn.sync).toHaveBeenCalledWith(
      'npx',
      [
        'prettier',
        '--write',
        '.'
      ],
      {
        stdio: 'inherit',
        cwd: 'foo'
      }
    );
  });

  it('should add Prettier to peer dependencies', async () => {
    mockLatestVersion.and.callFake((packageName) => {
      switch (packageName) {
        case 'prettier':
          return '1.0.0';
        case 'eslint-config-prettier':
          return '2.0.0';
      }
    });

    const packageJson = {};

    await prettierUtils.addPrettierToDevDependencies(packageJson);

    expect(packageJson).toEqual({
      devDependencies: {
        'prettier': '1.0.0',
        'eslint-config-prettier': '2.0.0'
      }
    });
  });
});
