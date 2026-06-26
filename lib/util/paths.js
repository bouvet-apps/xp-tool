const fs = require("fs");
const path = require("path");
const findParentDir = require("find-parent-dir");

const findBaseDir = () => {
  let baseDir;
  if (!baseDir) baseDir = findParentDir.sync(process.cwd(), "code");
  if (!baseDir) baseDir = findParentDir.sync(process.cwd(), "gradle.properties");
  if (!baseDir) baseDir = process.cwd();
  return baseDir;
};
const BASE_DIR = findBaseDir();

const findCodeDir = () => {
  if (fs.existsSync(path.resolve(BASE_DIR, "code/"))) return path.resolve(BASE_DIR, "code/");
  return BASE_DIR;
};
const CODE_DIR = findCodeDir();

const resolveExistingDirectory = (baseDir, candidates, fallback) => {
  for (const candidate of candidates) {
    const resolvedPath = path.resolve(baseDir, candidate);
    if (fs.existsSync(resolvedPath)) return resolvedPath;
  }

  return path.resolve(baseDir, fallback);
};

const SETTINGS_DIR = path.resolve(BASE_DIR, ".xptool/");
const RESOURCE_DIR = path.resolve(CODE_DIR, "src/main/resources");
const SITE_DIR = resolveExistingDirectory(RESOURCE_DIR, ["cms", "site"], "site");
const BUILD_SITE_DIR = resolveExistingDirectory(path.resolve(CODE_DIR, "build/resources/main"), ["cms", "site"], "site");

module.exports = {
  BASE_DIR,
  CODE_DIR,
  SETTINGS_DIR,
  RESOURCE_DIR,
  SITE_DIR,
  BUILD_SITE_DIR
};
