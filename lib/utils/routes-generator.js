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

function generateRoutesFromIndexFiles(guards) {
  const routeComponents = [];
  const routes = [];

  const indexFiles = glob.sync('src/app/**/index.html', {
    nodir: true
  });

  indexFiles.forEach(indexFile => {
    const routePath = indexFile.replace('src/app', '').replace('/index.html', '').replace(/\/_/g, '/:').replace(/^\//, '');
    const classifiedName = (routePath) ? strings.classify(routePath.replace(/#|_|\/|:/g, '-')) : 'Root';
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

    if (guard) {
      if (guard.canActivate) {
        route.canActivate = [guard.className];
      }
      if (guard.canActivateChild) {
        route.canActivateChild = [guard.className];
      }
      if (guard.canDeactivate) {
        route.canDeactivate = [guard.className];
      }
    }

    routeComponents.push(indexComponent);

    // The route for the root component is added later.
    if (classifiedName !== 'Root') {
      routes.push(route);
    }
  });

  return {
    routeComponents,
    routesConfig: assignChildrenToParents(routes)
  };
}

function getRoutes(skyuxConfig) {

  const redirects = getRedirects(skyuxConfig);
  const guards = getRouteGuards();

  const routesConfig = [
    {
      path: '',
      component: 'RootRouteIndexComponent',
      children: []
    },
    {
      path: '**',
      component: 'NotFoundComponent'
    }
  ];

  const routes = generateRoutesFromIndexFiles(guards);
  const rootRoute = routesConfig[0];
  rootRoute.children = routes.routesConfig;

  return {
    guards,
    routeComponents: routes.routeComponents,
    routesConfig: redirects.concat(routesConfig)
  };
}

module.exports = {
  getRoutes
};
