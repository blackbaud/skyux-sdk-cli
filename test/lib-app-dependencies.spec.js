const mock = require('mock-require');

describe('App dependencies', () => {
  let appDependencies;
  let getPackageJsonMock;
  let packageMapMock;

  beforeEach(() => {
    getPackageJsonMock = jasmine.createSpy('getPackageJson');

    packageMapMock = {
      getPackage: jasmine.createSpy('getPackage').and.callFake((name) => {
        return {
          package: name
        };
      })
    };

    mock('package-json', getPackageJsonMock);
    mock('../lib/package-map', packageMapMock);

    appDependencies = mock.reRequire('../lib/app-dependencies');
  });

  afterEach(() => {
    mock.stopAll();
  });

  describe('createPackageJsonDependencies() method', () => {

    it('should add dependencies from the dependency list', async () => {
      getPackageJsonMock.and.returnValue({
        name: '@skyux/indicators'
      });

      const result = await appDependencies.createPackageJsonDependencies(
        {
          '@skyux/indicators': { },
          '@skyux-sdk/bar': { }
        }
      );

      expect(result).toEqual(
        {
          dependencies: jasmine.objectContaining({
            '@skyux/assets': '9.8.7',
            '@skyux/indicators': '9.8.7'
          }),
          devDependencies: jasmine.objectContaining({
            '@skyux-sdk/bar': '9.8.7'
          })
        }
      );
    });

    it('should add peer dependencies of SKY UX packages', async () => {
      getPackageJsonMock.and.returnValue({
        name: '@skyux/indicators',
        peerDependencies: {
          foo: '^9.8.0'
        }
      });

      const result = await appDependencies.createPackageJsonDependencies(
        {
          '@skyux/indicators': { }
        }
      );

      expect(result.dependencies).toEqual(
        jasmine.objectContaining({
          '@skyux/assets': '9.8.7',
          '@skyux/indicators': '9.8.7',
          'foo': '9.8.7'
        })
      );
    });

    it('should skip installation of specified packages', async () => {
      getPackageJsonMock.and.returnValue({
        name: '@skyux/foo'
      });

      packageMapMock.getPackage.and.returnValue({
        package: '@skyux/foo',
        skipInstall: true
      });

      const result = await appDependencies.createPackageJsonDependencies(
        {
          '@skyux/foo': { }
        }
      );

      expect(result.dependencies).not.toEqual(
        jasmine.objectContaining({
          '@skyux/foo': jasmine.any(String)
        })
      );

    });

    it('should add builder plugins from the package map', async () => {
      getPackageJsonMock.and.returnValue({
        name: '@skyux/indicators'
      });

      packageMapMock.getPackage.and.returnValue({
        package: '@skyux/indicators',
        builderPlugins: [
          '@blackbaud/skyux-builder-plugin-foo',
          '@skyux-sdk/builder-plugin-bar'
        ]
      });

      const result = await appDependencies.createPackageJsonDependencies(
        {
          '@skyux/indicators': { }
        }
      );

      expect(result).toEqual(
        {
          dependencies: jasmine.objectContaining({
            '@skyux/indicators': '9.8.7'
          }),
          devDependencies: jasmine.objectContaining({
            '@blackbaud/skyux-builder-plugin-foo': '9.8.7',
            '@skyux-sdk/builder-plugin-bar': '9.8.7'
          })
        }
      );
    });

    it('should add Stache library if `StacheModule` found in source', async () => {
      getPackageJsonMock.and.returnValue({
        name: '@skyux/indicators'
      });

      const result = await appDependencies.createPackageJsonDependencies(
        {
          '@blackbaud/skyux-lib-stache': { }
        }
      );

      expect(result.dependencies).toEqual(
        jasmine.objectContaining({
          '@blackbaud/skyux-lib-stache': '9.8.7'
        })
      );
    });

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

      await appDependencies.upgradeDependencies({
        'prerelease-foo': '1.0.0-alpha.0'
      });

      await appDependencies.upgradeDependencies({
        'prerelease-foo': '1.0.0-beta.0'
      });
    });

    it('should handle "latest" versions', async () => {
      await appDependencies.upgradeDependencies({
        'prerelease-foo': 'latest'
      });
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
