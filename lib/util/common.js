const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

const { CODE_DIR } = require("./paths");
const { errorMessage } = require("./console");

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
  let resolvedDependency = path.resolve(__dirname, "../node_modules", dependency);
  if (!fse.existsSync(resolvedDependency)) resolvedDependency = path.resolve(CODE_DIR, "node_modules", dependency);
  return resolvedDependency;
}

module.exports = {
  getDirectories,
  isDirectory,
  executeIfPathAvailable,
  lookupDependency
};
