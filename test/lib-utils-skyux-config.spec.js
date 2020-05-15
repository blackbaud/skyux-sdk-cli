const mock = require('mock-require');

const SKYUX_CONFIG_SCHEMA_PATH = './node_modules/@skyux/config/skyuxconfig-schema.json';

describe('SKY UX Config util', function () {
  let loggerMock;
  let globMock;
  let jsonUtilsMock;
  let pactMock;
  let testSkyUxConfigJson;

  beforeEach(() => {
    loggerMock = {
      info() {}
    };

    globMock = {
      sync: () => []
    };

    testSkyUxConfigJson = {};

    jsonUtilsMock = {
      readJson: () => Promise.resolve(JSON.parse(JSON.stringify(testSkyUxConfigJson))),
      writeJson: () => Promise.resolve()
    };

    pactMock = {
      configExists: () => Promise.resolve(false)
    };

    mock('@blackbaud/skyux-logger', loggerMock);
    mock('glob', globMock);
    mock('../lib/utils/json-utils', jsonUtilsMock);
    mock('../lib/utils/pact', pactMock);
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should remove `experimental` from omnibar config', async () => {
    testSkyUxConfigJson = {
      omnibar: {
        experimental: true,
        foo: 'bar'
      }
    };

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.omnibar).toEqual({
      foo: 'bar'
    });
  });

  it('should remove SKY UX theme stylesheet from omnibar config', async () => {
    testSkyUxConfigJson = {
      app: {
        styles: [
          '@skyux/theme/css/sky.css',
          'foo.css'
        ]
      }
    };

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.app.styles).toEqual([
      'foo.css'
    ]);
  });

  it('should add host frame options to omnibar config', async () => {
    testSkyUxConfigJson = {
      host: {
        foo: 'bar'
      }
    };

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.host).toEqual({
      frameOptions: {
        none: true
      },
      foo: 'bar'
    });
  });

  it('should not add host frame options if already set', async () => {
    testSkyUxConfigJson = {
      host: {
        frameOptions: {
          foo: 'bar'
        }
      }
    };

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.host).toEqual({
      frameOptions: {
        foo: 'bar'
      }
    });
  });

  it('should add pact plugin', async () => {
    testSkyUxConfigJson = {};

    spyOn(pactMock, 'configExists').and.returnValue(Promise.resolve(true));

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.plugins).toEqual([
      '@skyux-sdk/builder-plugin-pact'
    ]);
  });

  it('should add pact plugin and leave other plugins untouched', async () => {
    testSkyUxConfigJson = {
      plugins: [
        '@foo/bar'
      ]
    };

    spyOn(pactMock, 'configExists').and.returnValue(Promise.resolve(true));

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    const config = writeSpy.calls.allArgs()[0][1];
    expect(config.plugins).toEqual([
      '@foo/bar',
      '@skyux-sdk/builder-plugin-pact'
    ]);
  });

  it('should remove deprecated properties', async () => {
    testSkyUxConfigJson = {
      skyuxModules: []
    };

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    expect(writeSpy.calls.allArgs()).toEqual({
      $schema: SKYUX_CONFIG_SCHEMA_PATH,
      host: {
        frameOptions: {
          none: true
        }
      }
    });
  });

  it('should check skyuxconfig.json files for all commands', async () => {
    testSkyUxConfigJson = {};

    spyOn(globMock, 'sync').and.returnValue([
      'skyuxconfig.serve.json',
      'skyuxconfig.pact.json'
    ]);

    const util = mock.reRequire('../lib/utils/skyux-config');
    const writeSpy = spyOn(jsonUtilsMock, 'writeJson').and.callThrough();

    await util.validateSkyUxConfigJson();

    expect(writeSpy.calls.allArgs()).toEqual([
      ['skyuxconfig.json', {
        $schema: SKYUX_CONFIG_SCHEMA_PATH,
        host: {
          frameOptions: {
            none: true
          }
        }
      }],
      ['skyuxconfig.serve.json', {
        $schema: SKYUX_CONFIG_SCHEMA_PATH
      }],
      ['skyuxconfig.pact.json', {
        $schema: SKYUX_CONFIG_SCHEMA_PATH
      }]
    ]);
  });

});
