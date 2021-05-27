const fs = require('fs-extra');
const path = require('path');

const appComponentSpec = `import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'skyux-app-shell',
  template: '<div class="shell-wrapper"><ng-content></ng-content></div>'
})
class MockShellComponent { }

@Component({
  selector: 'app-route-test',
  template: '<div class="hello-test">Hello</div>'
})
class AppRouteTestComponent { }

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          {
            component: AppRouteTestComponent,
            path: ''
          }
        ])
      ],
      declarations: [
        MockShellComponent,
        AppRouteTestComponent,
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should contain a router outlet wrapped by the app shell component', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const compiled = fixture.nativeElement;

    const router = TestBed.inject(Router);
    await router.navigate(['']);

    expect(
      compiled.querySelector('.shell-wrapper .hello-test').textContent
    ).toContain('Hello');
  });
});
`;

/**
 * Makes necessary modifications to the AppComponent.
 */
function modifyAppComponent(ejectedProjectPath) {
  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app.component.html'),
    `<router-outlet></router-outlet>`
  );

  // This unit test expects `skyux-app-shell` to be added to the template, which will happen
  // after the SKY UX schematic has been added.
  fs.writeFileSync(
    path.join(ejectedProjectPath, 'src/app/app.component.spec.ts'),
    appComponentSpec
  );
}

module.exports = modifyAppComponent;
