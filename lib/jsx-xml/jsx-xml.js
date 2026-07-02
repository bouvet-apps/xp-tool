import { resolve, relative, dirname } from "path";
import { writeFile, readFile, unlink } from "fs/promises";
import fse from "fs-extra";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { sync as globSync } from "glob";
import babel from "@babel/core";
import * as util from "../util/index.js";

import { applyBoilerplate } from "./template.js";
import { getDependancies, updateDependencies } from "./dependency.js";

import {
  BABEL_OPTIONS, FILE_EXTENSION, XML_RENDER_OPTIONS, JSX_GLOB_PATH, JSX_BUILT_INS
} from "./constants.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// createRequire lets us load the CJS-format generated transpiled files and bust their cache
const require = createRequire(import.meta.url);

const builtInsString = `${Object.entries(JSX_BUILT_INS).map(([name, fileName]) => `const ${name} = require("${resolve(__dirname, "../../dist/components", fileName).replace(/\\/g, "/")}")`).join("\n")}\n${requireUncached.toString()}\n`;


/**
 * Transpile and compile all JSX files to XML
 * @param {object} options
 * @param {boolean} options.exitOnError If process should exit when transpiling and compiling catches error
 * @param {boolean} options.includeBuiltIns If built in components, (Summary, Image etc) should be included as dependancies in files
 */
async function initialBuild(options = {}) {
  const files = getAllJSXFiles();

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

  await cleanBuildArtifacts();
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

    if (fileContent.startsWith("<jsx")) {
      fileContent = await applyBoilerplate(fileContent, relativePath);
    }

    await updateDependencies(filePath, fileContent);

    const transpiled = (includeBuiltIns ? builtInsString : "") + babel.transformSync(fileContent, BABEL_OPTIONS).code.replace("require(\"jsx-xml\");", `require("${util.lookupDependency("jsx-xml")}");`);
    const transpiledBuildPath = targetPath;

    fse.ensureDirSync(dirname(transpiledBuildPath));

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
    let transpiledFile = requireUncached(targetPath);

    // Backward compatibility: jsx-xml 0.3.0 render() returns XMLBuilder object
    if (transpiledFile && typeof transpiledFile === "object" && typeof transpiledFile.end === "function") {
      transpiledFile = transpiledFile.end(XML_RENDER_OPTIONS);
    }

    if (typeof transpiledFile === "string" && transpiledFile !== null) {
      const xmlPath = targetPath.replace(FILE_EXTENSION, ".xml");

      fse.ensureDirSync(dirname(xmlPath));
      await writeFile(xmlPath, transpiledFile);
      try { await unlink(targetPath); } catch (e) { /* already removed */ }

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

function getAllJSXFiles() { return globSync(JSX_GLOB_PATH); }

/**
 * Remove all .xml.jsx files from build output directory.
 */
async function cleanBuildArtifacts() {
  const buildGlob = resolve(util.CODE_DIR, `build/resources/main/**/*${FILE_EXTENSION}`);
  const leftoverFiles = globSync(buildGlob);
  const deletes = leftoverFiles.map((f) => unlink(f).catch(() => {}));
  await Promise.all(deletes);
}

export {
  initialBuild,
  transformFile,
  transpileFile,
  compileFile,
  compileDependencies,
  requireUncached,
  getAllJSXFiles
};
