const mock = require('mock-require');
const path = require('path');

describe('updateSourceFiles', () => {
  let ejectedProjectPath;
  let globSyncSpy;
  let updateSourceFiles;
  let readFileSyncSpy;
  let writeFileSyncSpy;

  function validateWriteFile(filePath, contents) {
    expect(writeFileSyncSpy).toHaveBeenCalledWith(filePath, contents, {
      encoding: 'utf-8'
    });
  }

  beforeEach(() => {
    ejectedProjectPath = 'foo';

    globSyncSpy = jasmine.createSpy('sync').and.callFake((pattern) => {
      if (
        pattern ===
        path.join(ejectedProjectPath, 'src/app/**/*.+(html|css|scss|ts)')
      ) {
        return [
          path.join(ejectedProjectPath, 'src/app/bar/bar.component.ts'),
          path.join(ejectedProjectPath, 'src/app/bar/bar.component.scss'),
          path.join(ejectedProjectPath, 'src/app/bar/bar.component.spec.ts'),
          path.join(ejectedProjectPath, 'src/app/foo/foo.component.html'),
          path.join(ejectedProjectPath, 'src/app/foo/foo.component.scss'),
          path.join(ejectedProjectPath, 'src/app/foo/foo.component.spec.ts'),
          path.join(ejectedProjectPath, 'src/app/styles.css')
        ];
      }

      return [];
    });

    readFileSyncSpy = jasmine
      .createSpy('readFileSync')
      .and.callFake((filePath) => {
        switch (path.basename(filePath)) {
          case 'bar.component.spec.ts':
            return `import { SkyAppResourcesTestService } from '@skyux/i18n/testing';`;
          case 'bar.component.scss':
            return 'span { color: red }';
          case 'bar.component.ts':
            return '@Component({template: \'<img src="~/assets/image.png">\'})';
          case 'foo.component.html':
            return '<img src="~/assets/image.png"><img src="~/assets/image2.png">';
          case 'foo.component.scss':
            return '.img { background-image: url(~/assets/image.png) }';
          case 'foo.component.spec.ts':
            return `import { SkyAppTestModule } from '@skyux-sdk/builder/runtime/testing/browser';`;
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

    updateSourceFiles = mock.reRequire(
      '../lib/utils/eject/update-source-files'
    );
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should update source files', () => {
    updateSourceFiles(ejectedProjectPath);

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(6);

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/bar/bar.component.spec.ts'),
      `import { SkyAppResourcesTestService } from '../__skyux/testing';`
    );

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/bar/bar.component.ts'),
      '@Component({template: \'<img src="assets/image.png">\'})'
    );

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/foo/foo.component.html'),
      '<img src="assets/image.png"><img src="assets/image2.png">'
    );

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/foo/foo.component.scss'),
      '.img { background-image: url(assets/image.png) }'
    );

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/foo/foo.component.spec.ts'),
      `import { SkyAppTestModule } from '../__skyux/testing';`
    );

    validateWriteFile(
      path.join(ejectedProjectPath, 'src/app/styles.css'),
      'div { background-image: url("assets/image.png") }'
    );
  });
});
