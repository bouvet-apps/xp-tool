const { resolve, relative } = require("path");
const { existsSync } = require("fs-extra");
const { renderTemplate, RESOURCE_DIR } = require("../util");
const { FILE_EXTENSION, XML_RENDER_OPTIONS } = require("./constants");

/**
 * Transform compact components to full boilerplated, ready for transpiling
 * @param {string} fileContent Text content of target file
 * @param {string} relativePath path to target file, relative to resource dir
 */
async function applyBoilerplate(fileContent, relativePath) {
  const docInfo = await getDocumentInfoForBoilerplate(fileContent);

  // Strip jsx tag and component imporst
  const content = (fileContent.xptMatch(/<jsx .*>([\s\S]*)<\/jsx>/m)[1])
    .replace(/<import .*\/>/gmi, "");

  const imports = docInfo.dependencies.map((dep) => {
    const path = resolveBoilerplateDependency(dep, dep.path, relativePath);

    let name = dep.componentName || dep.modelName;
    let require = "require";
    if (dep.modelName) {
      require = "requireUncached";

      if (dep.export) {
        name = `{ ${dep.export}: ${dep.modelName} }`;
      }
    }

    return `const ${name} = ${require}("${path}");`;
  });

  return renderTemplate("boilerplate", FILE_EXTENSION, {
    isComponent: docInfo.component,
    props: docInfo.props,
    imports,
    renderOptions: JSON.stringify(XML_RENDER_OPTIONS),
    name: "_document",
    content
  });
}


/**
 * Extract info from compact .xml.jsx file
 * @param {string} fileContent Text content of target file
 */
async function getDocumentInfoForBoilerplate(fileContent) {
  const type = "compact"; // Default type is compact

  const documentDependencies = [];

  // Get info from jsx tag
  const [jsxTag] = fileContent.xptMatch(/<jsx .*>/m);
  const [, componentName] = jsxTag.xptMatch(/name="(.*?)"/);
  const [, props] = jsxTag.xptMatch(/props={{(.*?)}}/);

  // Get dependencies
  const reg = /<import .*\/>/gmi;
  let importStatement;
  while ((importStatement = reg.exec(fileContent)) !== null) {
    const [statement] = importStatement;

    const [, depComponentName] = statement.xptMatch(/component="(.*?)"/);
    const [, , depModelName] = statement.xptMatch(/model=("|{)(.*?}?)("|})/);
    const [, depModelExport] = statement.xptMatch(/export="(.*?)"/);
    const [, depPath] = statement.xptMatch(/path="(.*?)"/);

    documentDependencies.push({
      ...(depComponentName && { componentName: depComponentName }),
      ...(depModelName && { modelName: depModelName }),
      ...(depModelExport && { export: depModelExport }),
      path: depPath
    });
  }

  return {
    type,
    props,
    componentName,
    component: !!componentName,
    dependencies: documentDependencies
  };
}


/**
 * Converts <import *> in compact templates to complete paths
 * @param {object} dep dependency object
 * @param {string} dep.componentName if dependency is a component and should be searched for in multiple locations
 * @param {string} dep.modelName if dependency is regular js file required
 * @param {string} path path to dependency
 * @param {string} currentComponentPath path to current component, relative to resource dir
 */
function resolveBoilerplateDependency({ componentName, modelName }, path = "", currentComponentPath) {
  const regex = new RegExp(`\\/[^/]*?${FILE_EXTENSION.replaceAll(".", "\\.")}`);
  const currentPath = currentComponentPath.replace(regex, "");
  const isComponent = componentName && !modelName;
  let resolvedDependency = "";

  if (isComponent) {
    const componentPath = sanitizeComponentPath(path, componentName);

    // Lookup prio
    const places = [
      resolve(RESOURCE_DIR, currentPath, componentPath),
      resolve(RESOURCE_DIR, "components", componentPath),
      resolve(RESOURCE_DIR, "site/components", componentPath),
      resolve(__dirname, "../dist/components", componentPath)
    ];
    resolvedDependency = places[0];

    for (const place of places) {
      if (existsSync(place)) {
        resolvedDependency = place;
        break;
      }
    }
  } else {
    resolvedDependency = resolve(RESOURCE_DIR, currentPath, path);
  }

  resolvedDependency = relative(resolve(RESOURCE_DIR, currentPath), resolvedDependency);
  if (!resolvedDependency.startsWith("..") && !resolvedDependency.startsWith("./")) return `./${resolvedDependency}`;

  return resolvedDependency;
}

/**
 * Transform lacking path to component
 * @param {string} path path to component file
 */
function sanitizeComponentPath(path, componentName) {
  let sanitizedName = path;
  if (!sanitizedName.endsWith(FILE_EXTENSION)) {
    if (sanitizedName.length > 0 && !sanitizedName.endsWith("/")) sanitizedName += "/";

    // MyField -> my-field.jsx.xml
    sanitizedName += `${componentName.replace(/([A-Z])/g, (a, b, index) => `${index > 0 ? "-" : ""}${a.toLowerCase()}`)}${FILE_EXTENSION}`;
  }
  return sanitizedName;
}


module.exports = {
  applyBoilerplate,
  getDocumentInfoForBoilerplate,
  resolveBoilerplateDependency,
  sanitizeComponentPath
};
