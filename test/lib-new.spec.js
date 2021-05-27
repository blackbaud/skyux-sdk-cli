const mock = require('mock-require');
const path = require('path');

describe('skyux new command', () => {
  let promptDoneSpy;

  beforeEach(() => {
    promptDoneSpy = jasmine.createSpy('promptDone');
  });

  afterEach(() => {
    mock.stopAll();
  });

  function spyOnLogger() {
    const spyLoggerPromise = jasmine.createSpyObj('getLoggerResponse', [
      'succeed',
      'fail'
    ]);
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
        questions[0].validate.call(
          {
            async() {
              return promptDoneSpy;
            }
          },
          value
        );
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
    const spyFs = jasmine.createSpyObj('fs-extra', [
      'readdirSync',
      'removeSync',
      'copySync',
      'readJsonSync',
      'writeJson',
      'existsSync'
    ]);
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

  function getSpies(name, repo) {
    const spyClone = spyOnClone();
    const spyFs = spyOnFs();
    const spyLatestVersion = spyOnLatestVersion();
    const spyLoggers = spyOnLogger();
    const spyNpmInstall = spyOnNpmInstall();
    const spyPrompt = spyOnPromptly(name, repo);
    const spySpawn = spyOnSpawn();

    return {
      spyClone,
      spyFs,
      spyLatestVersion,
      spyLogger: spyLoggers.spyLogger,
      spyLoggerPromise: spyLoggers.spyLoggerPromise,
      spyNpmInstall,
      spyPrompt,
      spySpawn
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
        "What is the URL to your repo? (leave this blank if you don't know)"
      );
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        "\nCreating a single-page application (SPA) named 'skyux-spa-name'..."
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
      spies.spyFs.readJsonSync.and.returnValue({});
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
        "What is the URL to your repo? (leave this blank if you don't know)"
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

    it("should checkout the repo's master branch", async () => {
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

    it('should handle errors when checking out the `initial-commit` branch', async () => {
      const name = 'my-spa-name';
      const repo = 'https://example.com/custom-repo.git';
      const error = 'custom-checkout-error';
      const spies = getSpies(name, repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readdirSync.and.returnValue([]);
      spies.spyFs.readJsonSync.and.returnValue({});
      spies.spySpawn.spawnWithOptions.and.throwError(error);
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
      expect(spies.spyLoggerPromise.fail).toHaveBeenCalled();
      expect(spies.spyLogger.error).toHaveBeenCalledWith(Error(error));
    });
  });

  describe('cloning template', () => {
    it('should use the template flag as a Git URL if it contains a colon', async () => {
      const template = 'https://example.com/custom-template.git';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({ template });
      expect(spies.spyLoggerPromise.succeed).toHaveBeenCalledWith(
        `${template} template successfully cloned.`
      );
    });

    it('should clone use the alias `t`', async () => {
      const template = 'custom-template';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({
        t: template
      });
      expect(spies.spyLoggerPromise.succeed).toHaveBeenCalledWith(
        `${template} template successfully cloned.`
      );
    });

    it("should checkout the repo's 4.x.x branch", async () => {
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({});
      expect(expect(spies.spyClone.calls.argsFor(0)[2]).toBe('4.x.x'));
    });

    it('should handle an error cloning a template because of url', async () => {
      const template = 'custom-template';
      const error = 'custom-cloning-error';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.reject({ message: error }));
      await getLib()({ template });
      expect(spies.spyLoggerPromise.fail).toHaveBeenCalledWith(
        `Template not found at location, https://github.com/blackbaud/skyux-sdk-template-${template}.`
      );
    });

    it('should handle an error cloning a template because of current branch', async () => {
      const branch = '4.x.x';
      const template = 'custom-template';
      const error = 'custom-branch-error status 1,';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(
        Promise.reject({ message: error, branch })
      );
      await getLib()({ template });
      expect(spies.spyLoggerPromise.fail).toHaveBeenCalledWith(
        `Template found but missing corresponding ${branch} branch. Please consult the template owner or use the '--branch' flag.`
      );
    });

    it('should clone the default template if template flag is used without a name', async () => {
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({
        template: {
          url: 'does-not-matter'
        }
      });
      expect(spies.spyLoggerPromise.succeed).toHaveBeenCalledWith(
        `default template successfully cloned.`
      );
    });

    it('should clone the default template if custom template not provided', async () => {
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      await getLib()({});
      expect(spies.spyLoggerPromise.succeed).toHaveBeenCalledWith(
        `default template successfully cloned.`
      );
    });

    it('should handle errors when cleaning the template', async () => {
      const error = 'custom-cleanup-error';
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readJsonSync.and.returnValue({});
      spies.spyFs.removeSync.and.throwError(error);
      await getLib()({});
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        'Template cleanup failed.'
      );
    });
  });

  describe('miscellaneous', () => {
    it('should pass stdio: inherit to spawn when logLevel is verbose', async () => {
      const spies = getSpies('name', '');
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readJsonSync.and.returnValue({});
      spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      spies.spyLogger.logLevel = 'verbose';
      await getLib()({});
      expect(spies.spyNpmInstall).toHaveBeenCalledWith(
        jasmine.objectContaining({
          stdio: 'inherit'
        })
      );
    });

    it('should update package dependencies & devDeps but not peerDeps', async () => {
      const name = 'custom-spa';
      const repo = 'https://example.com/custom-repo.git';

      const spies = getSpies(name, repo);
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      spies.spyFs.readdirSync.and.returnValue([]);
      spies.spyLatestVersion.and.callFake((dep) =>
        Promise.resolve(`${dep}-MOCKED-LATEST`)
      );
      spies.spyFs.readJsonSync.and.returnValue({
        dependencies: {
          foo: 'latest',
          bar: '1.0.0'
        },
        devDependencies: {
          foo: 'latest',
          bar: '1.0.0'
        },
        peerDependencies: {
          foo: 'latest',
          bar: '1.0.0'
        }
      });
      await getLib()({});

      const [writeJsonPath, writeJsonData, writeJsonOptions] =
        spies.spyFs.writeJson.calls.argsFor(0);
      expect(writeJsonPath).toEqual(
        path.join(`skyux-spa-${name}`, `tmp`, `package.json`)
      );
      expect(writeJsonData).toEqual(
        jasmine.objectContaining({
          dependencies: { foo: 'foo-MOCKED-LATEST', bar: 'bar-MOCKED-LATEST' },
          peerDependencies: { foo: 'latest', bar: '1.0.0' },
          devDependencies: {
            foo: 'foo-MOCKED-LATEST',
            bar: 'bar-MOCKED-LATEST'
          },
          name: `blackbaud-skyux-spa-${name}`,
          description: `A single-page application (SPA) named skyux-spa-${name}`,
          repository: {
            type: 'git',
            url: repo
          }
        })
      );
      expect(writeJsonOptions).toEqual(
        jasmine.objectContaining({
          spaces: 2
        })
      );
    });

    it('should handle libraries', async () => {
      const name = 'custom-lib';
      const spies = getSpies(name, '');
      spies.spyClone.and.returnValue(Promise.resolve());
      spies.spyFs.readJsonSync.and.returnValue({});
      spies.spySpawn.spawnWithOptions.and.returnValue(Promise.resolve());
      await getLib()({
        template: 'library'
      });
      expect(spies.spyFs.writeJson.calls.argsFor(0)[1].description).toBe(
        `A library named skyux-lib-${name}`
      );
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        `\nCreating a library named 'skyux-lib-${name}'...`
      );
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        `Created a library in directory skyux-lib-${name}`
      );
      expect(spies.spyLogger.info).toHaveBeenCalledWith(
        'Change into that directory and run `skyux serve -l local` to begin.'
      );
    });
  });
});
