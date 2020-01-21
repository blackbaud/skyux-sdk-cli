const mock = require('mock-require');

describe('App dependencies', () => {
  let appDependencies;
  let latestVersionMock;
  let getPackageJsonMock;
  let packageMapMock;

  beforeEach(() => {
    latestVersionMock = jasmine.createSpy('latestVersion').and.callFake((packageName) => {
      switch (packageName) {
        case '@foo/bar':
          return '12.2.5';
        case '@foo/baz':
          return '4.5.6';
      }
      return '9.8.7';
    });

    getPackageJsonMock = jasmine.createSpy('getPackageJson');

    packageMapMock = {
      getPackage: jasmine.createSpy('getPackage').and.callFake((name) => {
        return {
          package: name
        };
      })
    };

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
      const dependencies = {
        '@foo/bar': '12.2.3'
      };

      const devDependencies = {
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      };

      await appDependencies.upgradeDependencies(dependencies);

      expect(dependencies).toEqual({
        '@foo/bar': '12.2.5'
      });

      await appDependencies.upgradeDependencies(devDependencies);

      expect(devDependencies).toEqual({
        '@foo/baz': '4.5.6',
        'from-branch': 'foo/bar#branch'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        '@foo/bar',
        {
          version: '12'
        }
      );

      expect(latestVersionMock).toHaveBeenCalledWith(
        '@foo/baz',
        {
          version: '4'
        }
      );
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
        'prerelease-foo': 'latest'
      });

      expect(latestVersionMock).toHaveBeenCalledWith(
        'prerelease-foo',
        {
          version: '9'
        }
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
              peerDependencies: {
                '@blackbaud/skyux-lib-foo': '^9.8.0'
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

      await appDependencies.addSkyPeerDependencies(dependencies);

      expect(dependencies).toEqual(
        jasmine.objectContaining({
          '@skyux/bar': '9.8.7',
          '@blackbaud/skyux-lib-foo': '9.8.7',
          '@skyux/indicators': '9.8.7'
        })
      );
    });

    it('should handle missing dependencies section', async () => {
      const dependencies = undefined;

      await appDependencies.addSkyPeerDependencies(dependencies);

      expect(dependencies).toBeUndefined();
    });

  });

});
