const mock = require('mock-require');

describe('Ensure latest SKY UX versions', () => {
  const modulePath = '../lib/utils/eject/ensure-latest-skyux-packages';

  let latestVersionSpy;

  beforeEach(() => {
    mock('@blackbaud/skyux-logger', {
      info() {},
      verbose() {},
      warn() {}
    });

    latestVersionSpy = jasmine.createSpy('latestVersion')
      .and.callFake((_packageName, options) => {
        return options.version.substr(1);
      });

    mock('latest-version', latestVersionSpy);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should only upgrade SKY UX packages', async () => {
    const ensureLatestSkyuxPackages = mock.reRequire(modulePath);

    const dependencies = {
      '@blackbaud/foobar': '^1',
      '@blackbaud-internal/skyux-foobar': '~1.0.0',
      '@skyux/foobar': '~1',
      '@skyux-sdk/foobar': '^1.0.0',
      'foobar': '1' // <-- should not be updated
    };

    await ensureLatestSkyuxPackages(dependencies);

    expect(latestVersionSpy).toHaveBeenCalledWith('@blackbaud/foobar', { version: '^1' });
    expect(latestVersionSpy).toHaveBeenCalledWith('@blackbaud-internal/skyux-foobar', { version: '~1.0.0' });
    expect(latestVersionSpy).toHaveBeenCalledWith('@skyux/foobar', { version: '~1' });
    expect(latestVersionSpy).toHaveBeenCalledWith('@skyux-sdk/foobar', { version: '^1.0.0' });
    expect(latestVersionSpy).not.toHaveBeenCalledWith('foobar', { version: '1' });
  });

  it('should handle empty dependencies section', async () => {
    const ensureLatestSkyuxPackages = mock.reRequire(modulePath);

    await expectAsync(ensureLatestSkyuxPackages()).not.toBeRejected();
  });

  it('should skip packages with invalid version ranges', async () => {
    const ensureLatestSkyuxPackages = mock.reRequire(modulePath);

    const dependencies = {
      '@skyux/foobar': 'file:./invalid'
    };

    await ensureLatestSkyuxPackages(dependencies);

    expect(latestVersionSpy).not.toHaveBeenCalled();
  });

  it('should add a caret for specific versions', async () => {
    const ensureLatestSkyuxPackages = mock.reRequire(modulePath);

    const dependencies = {
      '@skyux/foobar': '1.2.1'
    };

    await ensureLatestSkyuxPackages(dependencies);

    expect(latestVersionSpy).toHaveBeenCalledWith('@skyux/foobar', { version: '^1.2.1' });
  });
});
