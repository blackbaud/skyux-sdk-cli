const fs = require('fs-extra');
const glob = require('glob');
const strings = require('./strings');

function readFile(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf-8' });
}

function extractRouteGuardDetails(fileName) {
  const contents = readFile(fileName);
  const matchRegexp = /@Injectable\s*\(\s*\)\s*export\s*class\s(\w+)/g;
  const match = matchRegexp.exec(contents);
  return {
    className: match[1],
    canActivate: contents.match(/canActivate\s*\(/g) !== null,
    canDeactivate: contents.match(/canDeactivate\s*\(/g) !== null,
    canActivateChild: contents.match(/canActivateChild\s*\(/g) !== null
  };
}

function getRouteGuards() {
  const guardFiles = glob.sync('src/app/**/index.guard.ts', { nodir: true });
  return guardFiles.map(fileName => {
    return Object.assign({}, {
      fileName
    }, extractRouteGuardDetails(fileName));
  });
}

function getRedirects(skyuxConfig) {
  if (!skyuxConfig.redirects) {
    return [];
  }

  return Object.keys(skyuxConfig.redirects).map(oldPath => ({
    path: oldPath,
    redirectTo: skyuxConfig.redirects[oldPath],
    pathMatch: (oldPath) ? 'prefix' : 'full'
  }));
}

function assignChildrenToParents(routes) {
  const findParent = (parentRoutes, parentPath) => {
    for (const parent of parentRoutes) {
      const found = (parent.path === parentPath);
      if (found) {
        return parent;
      }
      if (parent.children) {
        return findParent(parent.children, parentPath);
      }
    }
  };

  const parents = [];
  const children = [];

  routes.forEach(route => {
    const parts = route.path.split('/');
    const lastPart = parts.pop();
    if (lastPart.startsWith('#')) {
      route.path = route.path.replace(/#/g, '');
      children.push(route);
    } else {
      parents.push(route);
    }
  });

  children.reverse().forEach(child => {
    const parts = child.path.split('/');
    parts.pop();
    const parentPath = parts.join('/');
    const found = findParent(parents, parentPath);
    if (found) {
      found.children = found.children || [];
      found.children.push(child);
    }
  });

  return parents;
}

function applyRouteGuardConfig(guard, routeConfig) {
  if (guard) {
    /*istanbul ignore else*/
    if (guard.canActivate) {
      routeConfig.canActivate = [guard.className];
    }
    /*istanbul ignore else*/
    if (guard.canActivateChild) {
      routeConfig.canActivateChild = [guard.className];
    }
    /*istanbul ignore else*/
    if (guard.canDeactivate) {
      routeConfig.canDeactivate = [guard.className];
    }
  }
}

function generateRouteFromIndexFile(indexFile, guards) {
  const routePath = indexFile.replace('src/app', '').replace('/index.html', '').replace(/\/_/g, '/:').replace(/^\//, '');
  const classifiedName = strings.classify(routePath.replace(/#|_|\/|:/g, '-'));
  const className = `${classifiedName}RouteIndexComponent`;
  const routeParamsMatches = routePath.match(/:\w+/g);
  const routeParams = routeParamsMatches ? routeParamsMatches.map(p => p.replace(':', '')) : undefined;

  const indexComponent = {
    className,
    relativeFilePath: indexFile.replace('index.html', 'index.component.ts'),
    selector: `app-${strings.dasherize(classifiedName)}`,
    routeParams,
    templateFilePath: indexFile
  };

  const route = {
    path: routePath,
    component: className
  };

  const guard = guards.find(g => {
    return g.fileName.replace('index.guard.ts', '') === indexComponent.relativeFilePath.replace('index.component.ts', '');
  });

  applyRouteGuardConfig(guard, route);

  return {
    routeConfig: route,
    indexComponent
  };
}

function generateRoutesFromIndexFiles(guards) {
  const routeComponents = [];
  const routes = [];

  const indexFiles = glob.sync('src/app/**/index.html', {
    nodir: true,
    ignore: [
      'src/app/index.html'
    ]
  });

  indexFiles.forEach(indexFile => {
    const route = generateRouteFromIndexFile(indexFile, guards);
    routeComponents.push(route.indexComponent);
    routes.push(route.routeConfig);
  });

  const routesConfig = assignChildrenToParents(routes);

  return {
    routeComponents,
    routesConfig
  };
}

function getRoutesData(skyuxConfig) {
  const redirects = getRedirects(skyuxConfig);
  const guards = getRouteGuards();

  const rootRoute = {
    path: '',
    component: 'RootRouteIndexComponent'
  };

  const routesConfig = [
    rootRoute,
    {
      path: '**',
      component: 'NotFoundComponent'
    }
  ];

  const routes = generateRoutesFromIndexFiles(guards);
  if (routes.routesConfig.length) {
    rootRoute.children = routes.routesConfig;
  }

  return {
    guards,
    routeComponents: routes.routeComponents,
    routesConfig: redirects.concat(routesConfig)
  };
}

function getIndexComponentSource(indexComponent) {
  const className = indexComponent.className;
  const selector = indexComponent.selector;
  const routeParams = indexComponent.routeParams;

  if (routeParams) {
    let paramsProperties = [];
    let paramsConstructors = [];

    routeParams.sort().forEach(param => {
      paramsProperties.push(`public ${param}: string = '';`);
      paramsConstructors.push(`this.${param} = params.${param};`);
    });

    return `import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute
} from '@angular/router';

import {
  Subject
} from 'rxjs';

import {
  takeUntil
} from 'rxjs/operators';

@Component({
  selector: '${selector}',
  templateUrl: './index.component.html'
})
export class ${className} implements OnInit, OnDestroy {

  ${paramsProperties.join('\n\n  ')}

  private ngUnsubscribe = new Subject<void>();

  constructor(
    private route: ActivatedRoute
  ) { }

  public ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(params => {
        ${paramsConstructors.join('\n        ')}
      });
  }

  public ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
`;
  }

  return `import {
  Component
} from '@angular/core';

@Component({
  selector: '${selector}',
  templateUrl: './index.component.html'
})
export class ${className} { }
`;
}

function getRouteComponentImports(routeComponents) {
  return routeComponents.map(x => {
    const importPath = x.relativeFilePath.replace('src/app/', './').replace('.ts', '');
    return `import { ${x.className} } from '${importPath}';`;
  })
  .concat([
    `import { RootRouteIndexComponent } from './index.component';`,
    `import { NotFoundComponent } from './not-found.component';`
  ]);
}

function stringifyRoutesConfig(routes, indentLevel = 1) {
  const segments = [];
  const indent = ' '.repeat(2 * indentLevel);

  routes.forEach(config => {
    let str = (config.component)
      ? `{ path: '${config.path}', component: ${config.component}`
      : `{ path: '${config.path}', redirectTo: '${config.redirectTo}', pathMatch: '${config.pathMatch}'`;

    if (config.children) {
      const childrenSegments = stringifyRoutesConfig(config.children, indentLevel + 1);
      str += `, children: [\n${indent}  ${childrenSegments}\n${indent}]`;
    }

    if (config.canActivate) {
      str += `, canActivate: [${config.canActivate.join(',')}]`;
    }

    if (config.canActivateChild) {
      str += `, canActivateChild: [${config.canActivateChild.join(',')}]`;
    }

    if (config.canDeactivate) {
      str += `, canDeactivate: [${config.canDeactivate.join(',')}]`;
    }

    str += ' }';

    segments.push(str);
  });

  return segments.join(`,\n${indent}`);
}

module.exports = {
  getIndexComponentSource,
  getRouteComponentImports,
  getRoutesData,
  stringifyRoutesConfig
};
