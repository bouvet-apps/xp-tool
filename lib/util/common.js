import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

import { CODE_DIR } from "./paths.js";
import { errorMessage } from "./console.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const require = createRequire(import.meta.url);

/**
 * Gets all subdirectories in directory.
 *
 * @param {string} directory Path to directory to scan for subdirectories.
 */
function getDirectories(directory) {
  if (fs.existsSync(directory)) {
    return fs.readdirSync(directory).map(name => path.join(directory, name)).filter(isDirectory);
  }
  return [];
}

/**
 * Check if there is a directory at given path
 * @param {string} source Path to check if is a directory
 */
function isDirectory(source) { return fs.lstatSync(path.resolve(source)).isDirectory(); }

/**
 * Run function if target path is availeble, ie there is nothing there.
 * @param {string} targetDirectory target path to check for availebility
 * @param {function} callback Function to execute if path is availeble
 */
function executeIfPathAvailable(targetDirectory, callback) {
  if (fs.existsSync(targetDirectory)) {
    errorMessage(`Target path '${targetDirectory}' already exists.`);
  } else if (typeof callback === "function") {
    callback();
  }
}

/**
 * Check for npm dependancy in Xptool's node_modules, if it is not found there, check in xp projects node_modules
 * @param {string} dependency Name of npm package
 */
function lookupDependency(dependency) {
  const xptoolNodeModulesPath = path.resolve(__dirname, "../../node_modules");
  try {
    return require.resolve(dependency, { paths: [xptoolNodeModulesPath] });
  } catch (e) {
    try {
      return require.resolve(dependency, { paths: [CODE_DIR] });
    } catch (projectError) {
      throw new Error(`Cannot find module '${dependency}' in xptool's node_modules (${xptoolNodeModulesPath}) or project's node_modules (${CODE_DIR}). Please ensure '${dependency}' is installed as a dependency in xptool.`);
    }
  }
}

export {
  getDirectories,
  isDirectory,
  executeIfPathAvailable,
  lookupDependency
};
