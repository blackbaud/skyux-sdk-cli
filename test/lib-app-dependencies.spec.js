const mock = require('mock-require');

describe('App dependencies', () => {
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
      switch (packageName) {
        case '@foo/bar':
          return '12.2.5';
        case '@foo/baz':
          return '4.5.6';
        case 'from-branch':
          return 'foo/bar#branch';
        case 'foo':
          return '11.7.0';
        case 'bar':
          return '1.1.3';
        case 'baz':
          return '7.5.0';
        case 'sample':
          return '2.0.1';
        default:
          return '9.8.7';
      }
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

    appDependencies = mock.reRequire('../lib/app-dependencies');
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

    it('should use a specific range for TypeScript', async () => {
      const loggerSpy = spyOn(loggerMock, 'info').and.callThrough();

      await appDependencies.upgradeDependencies({
        'typescript': '2.1.0'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'typescript',
        {
          version: '~3.6.4'
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
          version: '~8.6.0'
        }
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        jasmine.stringMatching(/because Angular requires a specific minor version/)
      );
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
