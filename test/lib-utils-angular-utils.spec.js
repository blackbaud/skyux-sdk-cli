const mock = require('mock-require');
const path = require('path');

describe('Angular utils', () => {
  let writeFileSyncSpy;
  let defaultAppModuleContent;
  let defaultCompononentContent;

  beforeEach(() => {
    writeFileSyncSpy = jasmine.createSpy('writeFileSync');
    defaultAppModuleContent = `@NgModule({}) export class AppModule {}`;
    defaultCompononentContent = '';

    mock('fs-extra', {
      readFileSync(file) {
        if (file === path.join('src/app/app.module.ts')) {
          return defaultAppModuleContent;
        }

        if (file === 'foo.component.ts') {
          return defaultCompononentContent;
        }

        return '';
      },
      writeFileSync: writeFileSyncSpy
    });
  });

  afterEach(() => {
    mock.stopAll();
  });

  it('should should not add main module to itself', () => {
    const utils = mock.reRequire('../lib/utils/angular-utils');
    utils.addModuleToMainModuleImports('', 'AppModule', './app.module');
    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });

  it('should should not affect existing imports', () => {
    const utils = mock.reRequire('../lib/utils/angular-utils');
    defaultAppModuleContent = `@NgModule({
  imports: [
    CommonModule
  ]
})
export class AppModule { }`;
    utils.addModuleToMainModuleImports('', 'FooModule', './foo.module');
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join('src/app/app.module.ts'),
      `import {
  FooModule
} from './foo.module';

@NgModule({
  imports: [
    FooModule,
    CommonModule
  ]
})
export class AppModule { }`
    );
  });

  it('should handle missing imports section', () => {
    const utils = mock.reRequire('../lib/utils/angular-utils');
    defaultAppModuleContent = `@NgModule({
  exports: []
})
export class AppModule { }`;
    utils.addModuleToMainModuleImports('', 'FooModule', './foo.module');
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      path.join('src/app/app.module.ts'),
      `import {
  FooModule
} from './foo.module';

@NgModule({
imports: [
    FooModule
  ],
  exports: []
})
export class AppModule { }`
    );
  });

  it('should throw an error if file is not a component', () => {
    const utils = mock.reRequire('../lib/utils/angular-utils');
    defaultCompononentContent = `export class InvalidComponent {}`;
    try {
      utils.extractComponentName('foo.component.ts');
      fail('Expected to throw an error.');
    } catch (err) {
      expect(err.message).toEqual(
        'Unable to locate an exported class in foo.component.ts'
      );
    }
  });

  it('should throw an error if file exports more than one type', () => {
    const utils = mock.reRequire('../lib/utils/angular-utils');
    defaultCompononentContent = `@Component({}) export class OneComponent {}\n@Component({}) export class TwoComponent {}`;
    try {
      utils.extractComponentName('foo.component.ts');
      fail('Expected to throw an error.');
    } catch (err) {
      expect(err.message).toEqual(
        'As a best practice, please export one component per file in foo.component.ts'
      );
    }
  });
});
