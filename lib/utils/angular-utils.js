const fs = require('fs-extra');
const path = require('path');

function readFile(filePath) {
  return fs.readFileSync(filePath, { encoding: 'utf-8' });
}

function addModuleToMainModuleImports(projectDirectory, className, importPath) {
  const mainModulePath = path.join(projectDirectory, 'src/app/app.module.ts');

  let source = readFile(mainModulePath);
  if (source.indexOf(className) > -1) {
    return;
  }

  const ngModuleMatches = source.match(/@NgModule\s*\([\s\S]+\)/g);

  let ngModuleSource = ngModuleMatches[0];

  // Ensure the NgModel decorator has an `imports` section.
  const importsMatches = ngModuleSource.match(/(imports\s*:\s*\[[\s\S]*\])/g);

  let importsSource;
  if (importsMatches) {
    importsSource = importsMatches[0];
  } else {
    const ngModuleSourceStart = ngModuleSource.substr(0, ngModuleSource.indexOf('{') + 1);
    const ngModuleSourceEnd = ngModuleSource.substr(ngModuleSourceStart.length);

    const hasOtherModuleProps = ngModuleSourceEnd.replace(/\s/g, '') !== '})';

    importsSource = `
imports: []${hasOtherModuleProps ? ',' : '\n'}`;

    ngModuleSource = ngModuleSource.replace(ngModuleSourceStart, ngModuleSourceStart + importsSource);
  }

  // Add the `AppSkyModule` to imports.
  const importsSourceStart = importsSource.substr(0, importsSource.indexOf('[') + 1);
  const importsSourceEnd = importsSource.substring(importsSourceStart.length, importsSource.indexOf(']') + 1);

  ngModuleSource = `import { ${className} } from '${importPath}';\n
` +
  ngModuleSource.replace(
    importsSourceStart,
    importsSourceStart + `
    ${className}${importsSourceEnd === ']' ? '\n  ' : ','}`
  );

  source = source.replace(ngModuleMatches[0], ngModuleSource);

  fs.writeFileSync(mainModulePath, source);
}

function extractComponentName(file) {
  const content = readFile(file);
  const matches = content.split(/@Component\s*\([\s\S]+?\)\s*export\s+class\s+(\w+)/g);

  switch (matches.length) {
    case 3:
      return matches[1];

    case 1:
    case 2:
      throw new Error(`Unable to locate an exported class in ${file}`);

    default:
      throw new Error(`As a best practice, please export one component per file in ${file}`);
  }
}

module.exports = {
  addModuleToMainModuleImports,
  extractComponentName
};
