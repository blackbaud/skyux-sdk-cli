const mock = require('mock-require');

describe('skyux new command', () => {
  let promptDoneSpy;

  beforeEach(() => {
    promptDoneSpy = jasmine.createSpy('promptDone');
  });

  afterEach(() => {
    mock.stopAll();
  });

  function spyOnLogger() {
    const spyLoggerPromise = jasmine.createSpyObj('getLoggerResponse', ['succeed', 'fail']);
    const spyLogger = jasmine.createSpyObj('logger', [
      'info',
      'warn',
      'error',
      'verbose',
      'promise'
    ]);

    spyLogger.promise.and.returnValue(spyLoggerPromise);
    mock('@blackbaud/skyux-logger', spyLogger);
    return {
      spyLogger,
      spyLoggerPromise
    };
  }

  function spyOnPromptly(name, url) {
    const promptSpy = jasmine.createSpyObj('inquirer', ['prompt']);

    promptSpy.prompt.and.callFake((questions) => {
      let value = name;

      if (questions[0].message.indexOf('URL') > -1) {
        value = url;
      }

      if (questions[0].validate) {
        questions[0].validate.call({
          async() {
            return promptDoneSpy;
          }
        }, value);
      }

      return Promise.resolve({
        [questions[0].name]: value
      });
    });

    mock('inquirer', promptSpy);
    return promptSpy.prompt;
  }

  function spyOnSpawn() {
    const spySpawn = jasmine.createSpyObj('spawn', ['spawnWithOptions']);
    mock('../lib/utils/spawn', spySpawn);
    return spySpawn;
  }

  function spyOnClone() {
    const spyClone = jasmine.createSpy('clone');
    mock('../lib/utils/clone', spyClone);
    return spyClone;
  }

  function spyOnFs() {
    const spyFs = jasmine.createSpyObj(
      'fs-extra',
      ['readdirSync', 'removeSync', 'copySync', 'existsSync']
    )
    mock('fs-extra', spyFs);
    return spyFs;
  }

  function spyOnLatestVersion() {
    const spyLatestVersion = jasmine.createSpy('latest-version');
    mock('latest-version', spyLatestVersion);
    return spyLatestVersion;
  }

  function spyOnNpmInstall() {
    const spyNpmInstall = jasmine.createSpy('npm-install');
    mock('../lib/utils/npm-install', spyNpmInstall);
    return spyNpmInstall;
  }

  function spyOnCreateAngularApplication() {
    const spy = jasmine.createSpy('createAngularApplication');
    mock('../lib/utils/eject/create-angular-application', spy);
    return spy;
  }

  function spyOnInstallAngularBuilders() {
    const spy = jasmine.createSpy('installAngularBuilders');
    mock('../lib/utils/eject/install-angular-builders', spy);
    return spy;
  }

  function spyOnInstallESLint() {
    const spy = jasmine.createSpy('installEsLint').and.returnValue(Promise.resolve());
    mock('../lib/utils/install-eslint', spy);
    return spy;
  }

  function spyOnJsonUtils() {
    const spy = jasmine.createSpyObj(
      'json-utils',
      [
        'readJson',
        'writeJson'
      ]
    );

    spy.writeJson.and.returnValue(Promise.resolve());

    mock('../lib/utils/json-utils', spy);
    return spy;
  }

  function spyOnPrettierUtils() {
    const spy = jasmine.createSpyObj(
      'prettier-utils',
      [
        'addPrettierToDevDependencies',
        'applyPrettierToFiles',
        'configurePrettier'
      ]
    );

    spy.addPrettierToDevDependencies.and.returnValue(Promise.resolve());
    spy.configurePrettier.and.returnValue(Promise.resolve());

    mock('../lib/utils/prettier-utils', spy);
    return spy;
  }

  function spyOnModifyAppComponent() {
    const spy = jasmine.createSpy('modifyAppComponent');
    mock('../lib/utils/eject/modify-app-component', spy);
    return spy;
  }

  function spyOnNewLibrary() {
    const spy = jasmine.createSpy('newLibrary');
    mock('../lib/utils/new/new-library', spy);
    return spy;
  }

  function getSpies(name, repo) {
    const spyClone = spyOnClone();
    const spyFs = spyOnFs();
    const spyLatestVersion = spyOnLatestVersion();
    const spyLoggers = spyOnLogger();
    const spyNpmInstall = spyOnNpmInstall();
    const spyPrompt = spyOnPromptly(name, repo);
    const spySpawn = spyOnSpawn();
    const spyCreateAngularApplication = spyOnCreateAngularApplication();
    const spyInstallAngularBuilders = spyOnInstallAngularBuilders();
    const spyInstallESLint = spyOnInstallESLint();
    const spyJsonUtils = spyOnJsonUtils();
    const spyPrettierUtils = spyOnPrettierUtils();
    const spyModifyAppComponent = spyOnModifyAppComponent();
    const spyNewLibrary = spyOnNewLibrary();

    return {
      spyClone,
      spyFs,
      spyLatestVersion,
      spyLogger: spyLoggers.spyLogger,
      spyLoggerPromise: spyLoggers.spyLoggerPromise,
      spyNpmInstall,
      spyPrompt,
      spySpawn,
      spyCreateAngularApplication,
      spyInstallAngularBuilders,
      spyInstallESLint,
      spyJsonUtils,
      spyPrettierUtils,
      spyModifyAppComponent,
      spyNewLibrary
    };
  }

  function getLib() {
    return mock.reRequire('../lib/new');
  }

  describe('SPA name', () => {
    it('should ask for a SPA name and url', async () => {
      const spies = getSpies('name', '');
      await getLib()({});
      expect(spies.spyPrompt.calls.argsFor(0)[0][0].message).toBe(
        'What is the root directory for your SPA? (example: my-spa-name)'
      );
      expect(spies.spyPrompt.calls.argsFor(1)[0][0].message).toBe(
        'What is the URL to your repo? (leave this blank if you don\'t know)'
      );
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        '\nCreating a single-page application (SPA) named \'skyux-spa-name\'...'
      );
    });

    it('should catch a SPA directory that already exists', async () => {
      const spies = getSpies('already-exists', '');
      spies.spyFs.existsSync.and.returnValue(true);
      await getLib()({});
      expect(promptDoneSpy).toHaveBeenCalledWith(
        'SPA directory already exists.'
      );
    });

    it('should catch a SPA name with invalid characters', async () => {
      getSpies('invalid name', '');
      await getLib()({});
      expect(promptDoneSpy).toHaveBeenCalledWith(
        'SPA root directories may only contain lower-case letters, numbers or dashes.'
      );
    });

    it('should use the --name argument', async () => {
      const spies = getSpies('name', '');
      spies.spyJsonUtils.readJson.and.returnValue(Promise.resolve({}));
      await getLib()({
        name: 'name'
      });
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        'Created a single-page application (SPA) in directory skyux-spa-name'
      );
    });

    it('should handle an invalid --name argument', async () => {
      const spies = getSpies('name', '');
      await getLib()({
        name: 'invalid name'
      });
      expect(spies.spyLogger.error).toHaveBeenCalledWith(
        'SPA root directories may only contain lower-case letters, numbers or dashes.'
      );
    });
  });

  describe('SPA repo', () => {
    async function validateCheckOutInitialCommit(testError) {
      const name = 'my-spa-name';
      const repo = 'https://example.com/custom-repo.git';
      const error = 'custom-checkout-error';
      const spies = getSpies(name, repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readdirSync.and.returnValue([]);
      spies.spyJsonUtils.readJson.and.returnValue(Promise.resolve({}));

      if (testError) {
        spies.spySpawn.spawnWithOptions.and.throwError(error);
      } else {
        spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      }

      await getLib()({});

      expect(spies.spySpawn.spawnWithOptions).toHaveBeenCalledWith(
        jasmine.objectContaining({
          cwd: `skyux-spa-${name}`,
          stdio: 'pipe'
        }),
        `git`,
        `checkout`,
        `-b`,
        `initial-commit`
      );

      if (testError) {
        expect(spies.spyLoggerPromise.fail).toHaveBeenCalled();
        expect(spies.spyLogger.error).toHaveBeenCalledWith(Error(error));
      } else {
        expect(spies.spyLoggerPromise.succeed).toHaveBeenCalled();
      }
    }

    it('should use the --repo argument', async () => {
      const repo = 'https://example.com/custom-repo.git';
      const spies = getSpies('name', '');
      await getLib()({ repo });
      expect(spies.spyClone.calls.argsFor(0)[0]).toBe(repo);
    });

    it('should not prompt for repo if `--no-repo` passed in', async () => {
      const spies = getSpies('name', '');
      await getLib()({
        repo: false // minimist converts `--no-repo` to `repo: false`
      });
      expect(spies.spyPrompt.calls.any()).not.toBe(
        'What is the URL to your repo? (leave this blank if you don\'t know)'
      );
    });

    it('should handle an error cloning the repo', async () => {
      const repo = 'https://example.com/custom-repo.git';
      const error = 'custom-cloning-error';
      const spies = getSpies('name', repo);
      spies.spyClone.and.throwError(error);
      await getLib()({});
      expect(spies.spyLogger.error).toHaveBeenCalledWith(error);
    });

    it('should checkout the repo\'s master branch', async () => {
      const repo = 'https://example.com/custom-repo.git';
      const spies = getSpies('name', repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({});
      expect(expect(spies.spyClone.calls.argsFor(0)[2]).toBe('master'));
    });

    it('should handle a non-empty repo when cloning', async () => {
      const repo = 'https://example.com/custom-repo.git';
      const spies = getSpies('name', repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readdirSync.and.returnValue(['non-empty-repo.txt']);
      await getLib()({});
      expect(spies.spyLogger.error).toHaveBeenCalledWith(
        'The command `skyux new` only works with empty repositories.'
      );
    });

    it('should treat `README.md` file and `.git` folder as a non-empty repo when cloning', async () => {
      const repo = 'https://example.com/custom-repo.git';
      const spies = getSpies('name', repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readdirSync.and.returnValue(['README.md', '.git']);
      await getLib()({});
      expect(spies.spyLoggerPromise.succeed).toHaveBeenCalled();
    });

    it('should check out the `initial-commit` branch', async () => {
      validateCheckOutInitialCommit(false);
    });

    it('should handle errors when checking out the `initial-commit` branch', async () => {
      validateCheckOutInitialCommit(true);
    });
  });

  describe('specifying template', () => {
    it('should support the alias `t`', async () => {
      const template = 'library';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({
        t: template
      });
      expect(spies.spyNewLibrary).toHaveBeenCalledOnceWith('.skyux-lib-name-tmp', 'name', 'skyux-lib-name');
    });
  });

  describe('miscellaneous', () => {
    it('should handle errors when cleaning the temp path', async () => {
      const error = 'custom-cleanup-error';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyJsonUtils.readJson.and.returnValue({});
      spies.spyFs.removeSync.and.throwError(error);
      await getLib()({});
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        'Temp path cleanup failed.'
      );
    });

    it('should pass stdio: inherit to spawn when logLevel is verbose', async () => {
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyJsonUtils.readJson.and.returnValue(Promise.resolve({}));
      spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      spies.spyLogger.logLevel = 'verbose';
      await getLib()({});
      expect(spies.spyNpmInstall).toHaveBeenCalledWith(
        jasmine.objectContaining({
          stdio: 'inherit'
        })
      );
    });

    it('should handle libraries', async () => {
      const name = 'custom-lib';
      const spies = getSpies(name, '');
      spies.spyJsonUtils.readJson.and.returnValue(Promise.resolve({}));
      spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      await getLib()({
        template: 'library'
      });

      expect(spies.spyNewLibrary).toHaveBeenCalledOnceWith('.skyux-lib-custom-lib-tmp', name, 'skyux-lib-' + name);

      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        `\nCreating a library named 'skyux-lib-${name}'...`
      );

      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        `Created a library in directory skyux-lib-${name}`
      );

      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        'Change into that directory and run `ng serve` to begin.'
      );
    });
  });
});
