const { resolve, relative, dirname } = require("path");
const { writeFile, readFile } = require("fs").promises;
const { ensureDirSync } = require("fs-extra");
const glob = require("glob");
const babel = require("@babel/core");
const util = require("../util");

const { applyBoilerplate } = require("./template");
const { getDependancies, updateDependencies } = require("./dependency");

const {
  BABEL_OPTIONS, FILE_EXTENSION, JSX_GLOB_PATH, JSX_BUILT_INS
} = require("./constants");

const builtInsString = `${Object.entries(JSX_BUILT_INS).map(([name, fileName]) => `const ${name} = require("${resolve(__dirname, "../../dist/components", fileName)}")`).join("\n")}\n${requireUncached.toString()}\n`;

// eslint-disable-next-line no-extend-native
String.prototype.xptMatch = function xptMatch(regexp) {
  return this.match(regexp) || [];
};


/**
 * Transpile and compile all JSX files to XML
 * @param {object} options
 * @param {boolean} options.exitOnError If process should exit when transpiling and compiling catches error
 * @param {boolean} options.includeBuiltIns If built in components, (Summary, Image etc) should be included as dependancies in files
 */
async function initialBuild(options = {}) {
  const files = getAllJSXFiles();

  // Transpile all files first
  const transpiles = [];
  files.forEach((filePath) => {
    transpiles.push(transpileFile(filePath, options));
  });
  await Promise.all(transpiles);

  const compiled = [];
  files.forEach((filePath) => {
    compiled.push(compileFile(filePath, options));
  });
  await Promise.all(compiled);
}

/**
 * Transpile and compile a file and its inbound dependancies
 * @param {string} filePath Path to target file
 */
async function transformFile(filePath) {
  await transpileFile(filePath);
  await compileFile(filePath);

  await compileDependencies(filePath);
}

/**
 * Transpile a jsx file to js
 * @param {object} options
 * @param {boolean} options.exitOnError If process should exit when transpiling and compiling catches error
 * @param {boolean} options.includeBuiltIns If built in components, (Summary, Image etc) should be included as dependancies in files
 */
async function transpileFile(filePath, { exitOnError = false, includeBuiltIns = true } = {}) {
  const relativePath = relative(util.RESOURCE_DIR, filePath);
  try {
    const targetPath = resolve(util.CODE_DIR, "build/resources/main", relativePath);
    let fileContent = await readFile(filePath, "utf8");

    // Apply boilerplate if file is using compact mode
    if (fileContent.startsWith("<jsx")) {
      fileContent = await applyBoilerplate(fileContent, relativePath);
    }

    await updateDependencies(filePath, fileContent);

    const transpiled = (includeBuiltIns ? builtInsString : "") + babel.transformSync(fileContent, BABEL_OPTIONS).code.replace("require(\"jsx-xml\");", `require("${util.lookupDependency("jsx-xml")}");`);
    const transpiledBuildPath = targetPath; // .replace(".jsx", "-xml.js");

    ensureDirSync(dirname(transpiledBuildPath));

    await writeFile(transpiledBuildPath, transpiled);
    util.successMessage(`Transpiled:      ${relativePath}`);
  } catch (err) {
    util.errorMessage(`Failed to transpile file at ${relativePath}`);
    console.log(err);

    if (exitOnError) {
      process.exit(1);
    }
  }
}

/**
 * Compile transpiled file to finished xml. Only compiles entry files (components that return render())
 * @param {string} filePath Path to target file
 * @param {object} options
 * @param {boolean} options.exitOnError If process should exit when transpiling and compiling catches error
 */
async function compileFile(filePath, { exitOnError = false } = {}) {
  const relativePath = relative(util.RESOURCE_DIR, filePath);
  try {
    const targetPath = resolve(util.CODE_DIR, "build/resources/main", relativePath);
    const transpiledFile = requireUncached(targetPath);

    if (typeof transpiledFile === "string" && transpiledFile !== null) {
      const xmlPath = targetPath.replace(FILE_EXTENSION, ".xml");

      ensureDirSync(dirname(xmlPath));
      await writeFile(xmlPath, transpiledFile);

      util.successMessage(`Compiled to XML: ${relativePath}`);
      return true;
    }
  } catch (err) {
    util.errorMessage(`Failed to compile file at ${relativePath}`);
    console.log(err);

    if (exitOnError) {
      process.exit(1);
    }
  }
  return false;
}

/**
 * Used when watching files for changes. Once we transpile a file, all files that require that file needs to be re-compiled
 * @param {string} filePath Path to target file
 * @param {number} depth max length of dependency chain we compile
 */
async function compileDependencies(filePath, depth = 0) {
  if (depth > 8) return;

  const absoluteFilePath = resolve("", filePath);

  const currentDependencies = getDependancies(absoluteFilePath);
  if (currentDependencies) {
    for (const [key, value] of Object.entries(currentDependencies.inbound)) {
      if (value) {
        compileFile(key);
        compileDependencies(key, depth + 1);
      }
    }
  }
}

function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  // eslint-disable-next-line import/no-dynamic-require
  return require(module);
}

function getAllJSXFiles() { return glob.sync(JSX_GLOB_PATH); }

module.exports = {
  initialBuild,
  transformFile,
  transpileFile,
  compileFile,
  compileDependencies,
  requireUncached,
  getAllJSXFiles
};
