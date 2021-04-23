const mock = require('mock-require');

describe('(v4-compat) App dependencies', () => {
  let appDependencies;
  let latestVersionMock;
  let getPackageJsonMock;
  let packageMapMock;
  let loggerMock;

  beforeEach(() => {
    loggerMock = {
      error() {},
      info() {},
      warn() {}
    };

    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName) => {
      let version;
      switch (packageName) {
        case '@foo/bar':
          version = '12.2.5';
          break;
        case '@foo/baz':
          version = '4.5.6';
          break;
        case 'from-branch':
          version = 'foo/bar#branch';
          break;
        case 'foo':
          version = '11.7.0';
          break;
        case 'bar':
          version = '1.1.3';
          break;
        case 'baz':
          version = '7.5.0';
          break;
        case 'sample':
          version = '2.0.1';
          break;
        case 'invalid':
          return Promise.reject(new Error());
        default:
          version = '9.8.7';
          break;
      }

      return Promise.resolve(version);
    });

    getPackageJsonMock = jasmine.createSpy('getPackageJson');

    packageMapMock = {
      getPackage: jasmine.createSpy('getPackage').and.callFake((name) => {
        return {
          package: name
        };
      })
    };

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('latest-version', latestVersionMock);
    mock('package-json', getPackageJsonMock);
    mock('../lib/package-map', packageMapMock);

    appDependencies = mock.reRequire('../../lib/v4-compat/app-dependencies');
  });

  afterEach(() => {
    mock.stopAll();
  });

  describe('upgradeDependencies() method', () => {

    it('should upgrade dependencies', async () => {

      // The utility should respect existing version ranges or convert hard-versions to ranges.
      const dependencies = {
        '@foo/bar': '12.2.3',
        'foo': '^11.0.0',
        'bar': '~1.1.1',
        'baz': 'latest',
        'sample': '1 || ^2'
      };

      const devDependencies = {
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      };

      await appDependencies.upgradeDependencies(dependencies);

      expect(dependencies).toEqual({
        '@foo/bar': '12.2.5',
        'foo': '11.7.0',
        'bar': '1.1.3',
        'baz': '7.5.0',
        'sample': '2.0.1'
      });

      await appDependencies.upgradeDependencies(devDependencies);

      expect(devDependencies).toEqual({
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('@foo/bar', {
        version: '^12.2.3'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('@foo/baz', {
        version: '^4.5.6'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('foo', {
        version: '>=11.0.0 <12.0.0-0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('bar', {
        version: '>=1.1.1 <1.2.0-0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('baz', {
        version: 'latest'
      });

      expect(latestVersionMock).toHaveBeenCalledWith('sample', {
        version: '>=1.0.0 <2.0.0-0||>=2.0.0 <3.0.0-0'
      });

      expect(latestVersionMock).not.toHaveBeenCalledWith('from-branch', {
        version: 'foo/bar#branch'
      });
    });

    it('should handle missing dependencies section', async () => {
      const dependencies = undefined;

      await appDependencies.upgradeDependencies(dependencies);

      expect(dependencies).toBeUndefined();
    });

    it('should handle prerelease versions', async () => {
      await appDependencies.upgradeDependencies({
        'prerelease-foo': '1.0.0-rc.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'prerelease-foo',
        {
          version: '^1.0.0-rc.0'
        }
      );

      await appDependencies.upgradeDependencies({
        'prerelease-foo': '1.0.0-alpha.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'prerelease-foo',
        {
          version: '^1.0.0-alpha.0'
        }
      );

      await appDependencies.upgradeDependencies({
        'prerelease-foo': '1.0.0-beta.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'prerelease-foo',
        {
          version: '^1.0.0-beta.0'
        }
      );
    });

    it('should handle "latest" versions', async () => {
      await appDependencies.upgradeDependencies({
        'latest-foo': 'latest'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'latest-foo',
        {
          version: 'latest'
        }
      );
    });

    it('should handle invalid versions', async () => {
      const loggerSpy = spyOn(loggerMock, 'warn').and.callThrough();

      await appDependencies.upgradeDependencies({
        'invalid': '1.0.0'
      });

      expect(loggerSpy).toHaveBeenCalledWith('Warning: Skipped package invalid because it did not provide a valid version or range: "^1.0.0".');
    });

    it('should use a specific range for TypeScript', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'typescript': '2.1.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'typescript',
        {
          version: '~3.8.3'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because TypeScript does not support semantic versioning/)
      );
    });

    it('should use a specific range for zone.js', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'zone.js': '1.1.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'zone.js',
        {
          version: '~0.10.2'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because Angular requires a specific minor version/)
      );
    });

    it('should use a specific range for ts-node', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'ts-node': '1.0.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'ts-node',
        {
          version: '~8.3.0'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because Angular requires a specific minor version/)
      );
    });

    it('should use a specific range for TSLint', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'tslint': '1.0.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'tslint',
        {
          version: '~6.1.0'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because Angular requires a specific minor version/)
      );
    });

    it('should use a specific range for Codelyzer', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'codelyzer': '2.1.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'codelyzer',
        {
          version: '^5.2.2'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because Angular requires a specific major version/)
      );
    });

    it('should use specific ranges for SKY UX and Angular packages', async () => {
      // Dependencies purposefully listed out of order:
      await appDependencies.upgradeDependencies({
        '@skyux-sdk/builder-plugin-skyux': '0.0.1',
        '@blackbaud/skyux-lib-stache': '0.0.1',
        '@blackbaud/skyux-lib-code-block': '0.0.1',
        '@blackbaud/skyux-lib-media': '0.0.1',
        '@skyux-sdk/testing': '0.0.1',
        '@skyux-sdk/builder-plugin-stache': '0.0.1',
        '@skyux/foobar': '0.0.1',
        '@skyux/auth-client-factory': '2.0.0',
        '@skyux-sdk/builder': '0.0.1',
        '@blackbaud/skyux-lib-restricted-view': '1.0.0',
        '@angular/common': '2.0.0',
        '@skyux-sdk/e2e': '0.0.1',
        '@skyux-sdk/pact': '0.0.1',
        '@blackbaud/skyux-lib-clipboard': '0.0.1',
        '@skyux-sdk/builder-plugin-pact': '0.0.1'
      });

      expect(latestVersionMock.calls.allArgs()).toEqual([
        [ '@angular/common', { version: '^9.0.0' } ],
        [ '@blackbaud/skyux-lib-clipboard', { version: '^4.0.0' } ],
        [ '@blackbaud/skyux-lib-code-block', { version: '^4.0.0' } ],
        [ '@blackbaud/skyux-lib-media', { version: '^4.0.0' } ],
        [ '@blackbaud/skyux-lib-restricted-view', { version: '^4.0.0' } ],
        [ '@blackbaud/skyux-lib-stache', { version: '^4.0.0' } ],
        [ '@skyux-sdk/builder', { version: '^4.0.0-rc.0' } ],
        [ '@skyux-sdk/builder-plugin-pact', { version: '^4.0.0-rc.0' } ],
        [ '@skyux-sdk/builder-plugin-skyux', { version: '^4.0.0-rc.0' } ],
        [ '@skyux-sdk/builder-plugin-stache', { version: '^2.0.0' } ],
        [ '@skyux-sdk/e2e', { version: '^4.0.0-rc.0' } ],
        [ '@skyux-sdk/pact', { version: '^4.0.0-rc.0' } ],
        [ '@skyux-sdk/testing', { version: '^4.0.0-rc.0' } ],
        [ '@skyux/auth-client-factory', { version: '^2.0.0' } ],
        [ '@skyux/foobar', { version: '^4.0.0-rc.0' } ]
      ]);
    });

  });

  describe('addSkyPeerDependencies() method', () => {

    it('should add peer dependencies for SKY UX dependencies', async () => {
      getPackageJsonMock.and.callFake((packageName) => {
        switch (packageName) {
          case '@skyux/indicators':
            return {
              name: '@skyux/indicators',
              version: '3.0.0',
              peerDependencies: {
                '@blackbaud/skyux-lib-foo': '^9.8.0',
                'non-blackbaud-peer': '~0.8.0',
                'tslib': '^1.0.0'
              }
            };
          case '@blackbaud/skyux-lib-foo':
            // Check that peers are getting added recursively
            // (`@blackbaud/skyux-lib-foo` requires a peer of `@skyux/bar`).
            return {
              name: '@blackbaud/skyux-lib-foo',
              peerDependencies: {
                '@skyux/bar': '^9.8.0'
              }
            };
          case '@skyux/bar':
            // Confirm that circular peers do not cause an infinite loop.
            return {
              name: '@skyux/bar',
              peerDependencies: {
                '@blackbaud/skyux-lib-foo': '^9.8.0'
              }
            };
          default:
            return {};
        }
      });

      const dependencies = {
        '@skyux/indicators': '9.8.7'
      };

      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.addSkyPeerDependencies(dependencies);

      expect(dependencies).toEqual(
        jasmine.objectContaining({
          '@skyux/bar': '9.8.7',
          '@blackbaud/skyux-lib-foo': '9.8.7',
          '@skyux/indicators': '9.8.7'
        })
      );

      // Verify dependencies are in alphabetical order.
      expect(Object.keys(dependencies)).toEqual([
        '@blackbaud/skyux-lib-foo',
        '@skyux/bar',
        '@skyux/indicators'
      ]);

      // Missing peers that are not SKY UX packages shouldn't be added.
      expect(dependencies).not.toEqual(jasmine.objectContaining({
        'non-blackbaud-peer': '~0.8.0'
      }));
      expect(loggerSpy).toHaveBeenCalledWith(
        `non-blackbaud-peer@~0.8.0 --> peer of @skyux/indicators@3.0.0`
      );

      // Package tslib should not be added to the warning log since it'll be a common missing peer.
      expect(dependencies).not.toEqual(jasmine.objectContaining({
        'tslib': '^1.0.0'
      }));
      expect(loggerSpy).not.toHaveBeenCalledWith(
        `tslib@^1.0.0 --> peer of @skyux/indicators@3.0.0`
      );
    });

    it('should handle missing dependencies section', async () => {
      const dependencies = undefined;

      await appDependencies.addSkyPeerDependencies(dependencies);

      expect(dependencies).toBeUndefined();
    });

  });

});
