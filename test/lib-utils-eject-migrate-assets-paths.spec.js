const mock = require('mock-require');
const path = require('path');

describe('migrateAssetsPaths', () => {
  let ejectedProjectPath;
  let globSyncSpy;
  let migrateAssetsPaths;
  let readFileSyncSpy;
  let writeFileSyncSpy;

  function validateWriteFile(filePath, contents) {
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      filePath,
      contents,
      {
        encoding: 'utf-8'
      }
    );
  }

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    globSyncSpy = jasmine.createSpy('sync').and.callFake((pattern) => {
      if (pattern === path.join(ejectedProjectPath, 'src/app/**/*.+(html|css|scss|ts)')) {
        return [
          path.join('foo.component.html'),
          path.join('foo.component.scss'),
          path.join('bar.component.ts'),
          path.join('bar.component.scss'),
          path.join('styles.css')
        ]
      }

      return [];
    });

    readFileSyncSpy = jasmine.createSpy('readFileSync').and.callFake((filePath) => {
      switch (filePath) {
        case 'foo.component.html':
          return '<img src="~/assets/image.png"><img src="~/assets/image2.png">';
        case 'foo.component.scss':
          return '.img { background-image: url(~/assets/image.png) }'
        case 'bar.component.ts':
          return '@Component({template: \'<img src="~/assets/image.png">\'})';
        case 'bar.component.scss':
          return 'span { color: red }';
        case 'styles.css':
          return 'div { background-image: url("~/assets/image.png") }';
      }
    });

    writeFileSyncSpy = jasmine.createSpy('writeFileSync');

    mock('glob', {
      sync: globSyncSpy
    });

    mock('fs-extra', {
      readFileSync: readFileSyncSpy,
      writeFileSync: writeFileSyncSpy
    });

    mock('@blackbaud/skyux-logger', {
      info: jasmine.createSpy('info'),
      verbose: jasmine.createSpy('verbose')
    });

    migrateAssetsPaths = mock.reRequire('../lib/utils/eject/migrate-assets-paths');
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should migrate asset paths', () => {
    migrateAssetsPaths(ejectedProjectPath);

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(4);

    validateWriteFile(
      'foo.component.html',
      '<img src="assets/image.png"><img src="assets/image2.png">'
    );

    validateWriteFile(
      'foo.component.scss',
      '.img { background-image: url(assets/image.png) }'
    );

    validateWriteFile(
      'bar.component.ts',
      '@Component({template: \'<img src="assets/image.png">\'})'
    );

    validateWriteFile(
      'styles.css',
      'div { background-image: url("assets/image.png") }'
    );
  });

});
