const path = require('path');
const mock = require('mock-require');

const CWD = process.cwd();

describe('migrateSkyuxConfigFiles', () => {
  let actualSkyuxConfig;
  let ejectedProjectPath;
  let migrateSkyuxConfigFiles;
  let mockFsExtra;
  let mockSkyuxConfig;
  let writeJsonSpy;

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    writeJsonSpy = jasmine.createSpy('writeJson').and.callFake((file, contents) => {
      if (file.indexOf('skyuxconfig.json') > -1) {
        actualSkyuxConfig = contents;
      }
    });

    mock('glob', {
      sync(pattern) {
        switch (pattern) {
          case 'skyuxconfig?(.*).json':
            return [path.join(CWD, 'skyuxconfig.json')];
        }

        return [];
      }
    });

    mockFsExtra = jasmine.createSpyObj(
      'fs-extra',
      ['readJsonSync']
    )

    mockFsExtra.readJsonSync.and.callFake(() => mockSkyuxConfig);

    mock('fs-extra', mockFsExtra);

    mock('../lib/utils/eject/write-json', writeJsonSpy);

    migrateSkyuxConfigFiles = mock.reRequire('../lib/utils/eject/migrate-skyux-config-files');
  });

  it('should migrate only accepted properties skyuxconfig.json files', () => {
    mockSkyuxConfig = {
      name: 'skyux-spa-foobar',
      app: {
        externals: {
          js: {
            before: {
              url: 'script.js'
            }
          }
        },
        theming: {
          supportedThemes: ['default', 'modern'],
          theme: 'modern'
        },
        invalidProp: {} // <-- should not be included
      },
      appSettings: {
        'foo': 'bar'
      },
      auth: true,
      help: {},
      host: {
        url: 'https://foo.blackbaud.com/'
      },
      omnibar: {},
      params: {
        foo: {
          required: true
        },
        bar: true
      },
      routes: {
        public: [
          '/foo'
        ]
      },
      codeCoverageThreshold: 'standard',
      invalidProp: {} // <-- should not be included
    };

    migrateSkyuxConfigFiles(ejectedProjectPath);

    expect(actualSkyuxConfig).toEqual({
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json',
      app: {
        externals: {
          js: {
            before: {
              url: 'script.js'
            }
          }
        },
        theming: {
          supportedThemes: ['default', 'modern'],
          theme: 'modern'
        }
      },
      appSettings: {
        'foo': 'bar'
      },
      auth: true,
      help: {},
      host: {
        url: 'https://foo.blackbaud.com/'
      },
      omnibar: {},
      params: {
        foo: {
          required: true
        },
        bar: true
      },
      routes: {
        public: [
          '/foo'
        ]
      },
      codeCoverageThreshold: 'standard'
    });
  });


  it('should skip supported properties not present in the skyuxconfig.json file', () => {
    mockSkyuxConfig = {
      name: 'skyux-spa-foobar',
      auth: true
    };

    migrateSkyuxConfigFiles(ejectedProjectPath);

    expect(actualSkyuxConfig).toEqual({
      $schema: './node_modules/@skyux-sdk/angular-builders/skyuxconfig-schema.json',
      auth: true
    });
  });
});
