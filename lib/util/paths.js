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

const SETTINGS_DIR = path.resolve(BASE_DIR, ".xptool/");
const RESOURCE_DIR = path.resolve(CODE_DIR, "src/main/resources");
const SITE_DIR = path.resolve(RESOURCE_DIR, "site/");
const BUILD_SITE_DIR = path.resolve(CODE_DIR, "build/resources/main/site");

module.exports = {
  BASE_DIR,
  CODE_DIR,
  SETTINGS_DIR,
  RESOURCE_DIR,
  SITE_DIR,
  BUILD_SITE_DIR
};
