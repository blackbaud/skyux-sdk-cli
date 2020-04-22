const fs = require('fs');
const glob = require('glob');
const mock = require('mock-require');
const logger = require('@blackbaud/skyux-logger');

describe('skyux CLI', () => {
  let spyProcessExit;

  beforeEach(() => {
    spyProcessExit = spyOn(process, 'exit');
    spyOn(logger, 'verbose');
    spyOn(logger, 'info');
    spyOn(logger, 'error');
    spyOn(logger, 'warn');
  })

  afterEach(() => {
    mock.stopAll();
  });

  function setupMock(noNameProperty, cwd) {
    cwd = cwd || 'current-working-directory';
    spyOn(process, 'cwd').and.returnValue(cwd);

    mock('path', {
      dirname: (dir) => dir.replace('/package.json', ''),
      join: (dir, pattern) => `${dir}/${pattern}`,
      resolve: () => {}
    });

    if (noNameProperty) {
      mock('local-module/package.json', {});
      mock('non-scoped-global-module/package.json', {});
      mock('scoped-global-module/package.json', {});
    } else {
      mock('local-module/package.json', {
        name: 'local-module-name'
      });
      mock('non-scoped-global-module/package.json', {
        name: 'non-scoped-global-module-name'
      });
      mock('scoped-global-module/package.json', {
        name: 'scoped-global-module-name'
      });
    }

    mock('glob', {
      sync: (pattern) => {

        // Emulates local package installed
        if (pattern.indexOf(cwd) > -1) {
          return [
            'local-module/package.json'
          ];

        // Emulates global package that's not scoped to @blackbaud
        } else if (pattern.indexOf('../..') > -1) {
          return [
            'non-scoped-global-module/package.json'
          ];

        // Emulates global package that's scoped
        } else {
          return [
            'scoped-global-module/package.json'
          ];
        }
      }
    });
  }

  function cli(options) {
      let requiredMock = mock.reRequire('../index');
      requiredMock(options);
  }

  function sharedTests() {
    it('should accept known command version', () => {
      let called = false;
      mock('../lib/version', {
        logVersion: () => {
          called = true;
        }
      });

      cli({ _: ['version'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept the -v flag', () => {
      let called = false;
      mock('../lib/version', {
        logVersion: () => {
          called = true;
        }
      });

      cli({ _: [''], v: true });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept known command help', () => {
      let called = false;
      mock('../lib/help', () => {
        called = true;
      });

      cli({ _: ['help'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept the -h flag', () => {
      let called = false;
      mock('../lib/help', () => {
        called = true;
      });

      cli({ _: [''], h: true });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should default to the help command', () => {
      let called = false;
      mock('../lib/help', () => {
        called = true;
      });

      cli({ _: [undefined] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept known command new', () => {
      let called = false;
      mock('../lib/new', () => {
        called = true;
      });

      cli({ _: ['new'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept known command install', () => {
      let called = false;
      mock('../lib/install', () => {
        called = true;
      });

      cli({ _: ['install'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept known command certs', () => {
      let called = false;
      mock('../lib/certs', () => {
        called = true;
      });

      cli({ _: ['certs'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept unknown command', () => {
      cli({ _: ['unknownCommand'] });
      expect(logger.info).toHaveBeenCalledWith(`SKY UX is processing the 'unknownCommand' command.`);
      expect(logger.error).toHaveBeenCalledWith(`No modules were found that handle the 'unknownCommand' command. Please check your syntax. For more information, use the 'help' command.`);
      expect(spyProcessExit).toHaveBeenCalledWith(1);
    });

    it('should accept known command upgrade', () => {
      let called = false;
      mock('../lib/upgrade', () => {
        called = true;
      });

      cli({ _: ['upgrade'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });

    it('should accept known command migrate', () => {
      let called = false;
      mock('../lib/migrate', () => {
        called = true;
      });

      cli({ _: ['migrate'] });
      expect(called).toEqual(true);
      expect(spyProcessExit).not.toHaveBeenCalled();
    });
  }

  describe('when missing modules', () => {
    beforeEach(() => {
      spyOn(glob, 'sync').and.returnValue([]);
    });

    it('should fail and log an error', () => {
      cli({ _: ['serve'] });
      expect(logger.info).toHaveBeenCalledWith(`SKY UX is processing the 'serve' command.`);
      expect(logger.error).toHaveBeenCalledWith(`No modules were found that handle the 'serve' command. Please check your syntax. For more information, use the 'help' command.`);
      expect(spyProcessExit).toHaveBeenCalledWith(1);
    });

    it('should log an error if no modules and path does not contain "skyux-spa"', () => {
      spyOn(process, 'cwd').and.returnValue('non-spa-dir');

      cli({ _: ['unknownCommand'] });
      expect(logger.error).toHaveBeenCalledWith(`Are you in a SKY UX SPA directory?`);
    });

    it('should log an error if path contains "skyux-spa" but the "node_modules" dir does not exist', () => {
      spyOn(process, 'cwd').and.returnValue('skyux-spa-dir');
      spyOn(fs, 'existsSync').and.returnValue(false);

      cli({ _: ['unknownCommand'] });
      expect(logger.error).toHaveBeenCalledWith(`The 'node_modules' folder was not found. Did you run 'npm install'?`);
    });

    it('should not log an special errors if in skyux-spa dir and node_modules exists', () => {
      spyOn(process, 'cwd').and.returnValue('skyux-spa-dir');
      spyOn(fs, 'existsSync').and.returnValue(true);

      cli({ _: ['unknownCommand'] });
      expect(logger.error).not.toHaveBeenCalledWith(`Are you in a SKY UX SPA directory?`);
      expect(logger.error).not.toHaveBeenCalledWith(`The 'node_modules' folder was not found. Did you run 'npm install'?`);
    })

    sharedTests();

  });

  describe('when containing modules', () => {
    beforeEach(() => {
      setupMock();
    });

    it('should look globally and locally for matching glob patterns', () => {
      const customCommand = 'customCommand';

      mock('local-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // command answered
          return true;
        }
      });

      mock('non-scoped-global-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // command answered
          return true;
        }
      });

      mock('scoped-global-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // command unanswered
          return false;
        }
      });

      cli({ _: [customCommand] });
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to local-module-name at local-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to non-scoped-global-module-name at non-scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to scoped-global-module-name at scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Successfully passed the '${customCommand}' command to 2 modules:`)
      expect(logger.verbose).toHaveBeenCalledWith(`local-module-name, non-scoped-global-module-name`);
    });

    it('should verbosely log the correct plural form of "module"', () => {
      const customCommand = 'customCommand';

      mock('local-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // command answered
          return true;
        }
      });

      mock('non-scoped-global-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // command answered
          return false;
        }
      });

      mock('scoped-global-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);

          // No return value
        }
      });

      cli({ _: [customCommand] });
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to local-module-name at local-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to non-scoped-global-module-name at non-scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to scoped-global-module-name at scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Successfully passed the '${customCommand}' command to 1 module:`);
      expect(logger.verbose).toHaveBeenCalledWith(`local-module-name`);
    });

    it('should fail and log an error if modules found but unknown command (none return true)', () => {
      const customCommand = 'customCommand';

      mock('local-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);
          return false;
        }
      });

      cli({ _: [customCommand] });
      expect(logger.error).toHaveBeenCalledWith(`No modules were found that handle the '${customCommand}' command. Please check your syntax. For more information, use the 'help' command.`);
    });

    it('should handle an error when requiring a malformed module', () => {
      const customCommand = 'customCommand';

      // not mocking global modules to simulate error
      mock('local-module', {
        runCommand: (cmd) => {
          expect(cmd).toBe(customCommand);
        }
      });

      cli({ _: [customCommand] });

      expect(logger.verbose).toHaveBeenCalledWith(
        `Error loading non-scoped-global-module/package.json.`
      );

    });

    sharedTests()
  });

  describe('when containing modules but no name property in package.json', () => {

    beforeEach(() => {
      setupMock(true);
      mock('local-module', {
        runCommand: () => {}
      });

      mock('non-scoped-global-module', {
        runCommand: () => {}
      });

      mock('scoped-global-module', {
        runCommand: () => {}
      });
    })

    it('should log path', () => {
      cli({ _: ['customCommand'] });

      expect(logger.verbose).not.toHaveBeenCalledWith(`Passing the ommand to local-module-name at local-module/package.json.`);
      expect(logger.verbose).not.toHaveBeenCalledWith(`Passing the command to non-scoped-global-module-name.`);
      expect(logger.verbose).not.toHaveBeenCalledWith(`Passing the command to scoped-global-module-name at scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to local-module at local-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to non-scoped-global-module at non-scoped-global-module/package.json.`);
      expect(logger.verbose).toHaveBeenCalledWith(`Passing the command to scoped-global-module at scoped-global-module/package.json.`);
    });

  });

  it('should not call the same package more than once', () => {
    const cwd = 'current-working-directory';
    spyOn(process, 'cwd').and.returnValue(cwd);

    mock('path', {
      dirname: (dir) => dir.replace('/package.json', ''),
      join: (dir, pattern) => `${dir}/${pattern}`,
      resolve: () => {}
    });

    mock('local-module/package.json', {
      name: 'duplicate-module-name'
    });

    mock('global-module/package.json', {
      name: 'duplicate-module-name'
    });

    mock('local-module', {
      runCommand: () => {}
    });

    mock('global-module', {
      runCommand: () => {}
    });

    mock('glob', {
      sync: (pattern) => {

        // Emulates local package installed
        if (pattern.indexOf(cwd) > -1) {
          return [
            'local-module/package.json'
          ];

        } else {
          return [
            'global-module/package.json'
          ];
        }
      }
    });

    cli({ _: ['customCommand'] });

    expect(logger.verbose).toHaveBeenCalledWith('Passing the command to duplicate-module-name at local-module/package.json.');
    expect(logger.verbose).toHaveBeenCalledWith(
      'Multiple instances were found. Skipping passing the command to duplicate-module-name at local-module/package.json.'
    );
  });

  it('should recognize packages in both `@blackbaud` and `@skyux-sdk` namespaces', () => {
    const patternsCalled = [];
    mock('path', {
      join: (dir, pattern) => {
        patternsCalled.push(pattern);
      },
      resolve: () => {}
    });

    mock('glob', {
      sync: () => []
    });

    mock('../lib/help', () => {});

    cli({ _: [] });

    expect(patternsCalled.includes('*/skyux-builder*/package.json')).toEqual(true);
    expect(patternsCalled.includes('@skyux-sdk/builder*/package.json')).toEqual(true);
  });

  it('should validate the cert for serve, e2e, and build (if also serving)', () => {
    const spyGenerator = jasmine.createSpyObj('generator', ['validate', 'getCertPath', 'getKeyPath']);

    mock('../lib/utils/certs/generator', spyGenerator);
    mock('glob', {
      sync: () => []
    });

    spyGenerator.validate.and.returnValue(false);

    const argvs = [
      { _: ['serve'] },
      { _: ['e2e'] },
      { _: ['build'], s: true },
      { _: ['build'], serve: true },
    ];

    argvs.forEach(argv => {
      cli(argv);
      expect(spyGenerator.validate).toHaveBeenCalledWith(argv);
      expect(logger.warn).toHaveBeenCalledWith(`Unable to validate ${argv.sslCert} and ${argv.sslKey}.`);
      expect(logger.warn).toHaveBeenCalledWith(`You may proceed, but \`skyux ${argv['_'][0]}\` may not function properly.`);
      spyGenerator.validate.calls.reset();
    });
  });

  it('should not validate the cert for test or build (without also serving)', () => {
    const spyGenerator = jasmine.createSpyObj('generator', ['validate', 'getCertPath', 'getKeyPath']);

    mock('../lib/utils/cert-utils', spyGenerator);
    mock('glob', {
      sync: () => []
    });

    const argvs = [
      { _: ['test'] },
      { _: ['build'] },
    ];

    argvs.forEach(argv => {
      cli(argv);
      expect(spyGenerator.validate).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalledWith(`Unable to validate ${argv.sslCert} and ${argv.sslKey}.`);
      expect(logger.warn).not.toHaveBeenCalledWith(`You may proceed, but \`skyux ${argv['_'][0]}\` may not function properly.`);
      spyGenerator.validate.calls.reset();
    });
  });

  it('should not validate the cert if --sslCert and --sslKey are passed in', () => {
    const certUtilsSpy = jasmine.createSpyObj('certUtils', ['validate', 'getCertPath', 'getKeyPath']);

    mock('../lib/utils/cert-utils', certUtilsSpy);
    mock('glob', {
      sync: () => []
    });

    // minimist converts --sslCert and --sslKey to properties
    const argv = {
      _: ['serve'],
      sslCert: 'custom-cert',
      sslKey: 'custom-key'
    };

    cli(argv);
    expect(certUtilsSpy.validate).not.toHaveBeenCalled();
  });

  it('should catch running install certs instead of certs install', () => {
    cli({ _: ['install', 'certs']});
    expect(logger.error).toHaveBeenCalledWith('The `skyux install` command is invalid.');
    expect(logger.error).toHaveBeenCalledWith('Did you mean to run `skyux certs install` instead?');
  });

});
