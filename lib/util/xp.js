import path from "path";
import fs from "fs";

import { RESOURCE_DIR, SITE_DIR, BUILD_SITE_DIR } from "./paths.js";
import { getDirectories } from "./common.js";
import * as paths from "./paths.js";

function findExistingFilename(directory, filenames) {
  for (const filename of filenames) {
    if (fs.existsSync(path.resolve(directory, filename))) return filename;
  }

  return null;
}


/**
 * Returns a list of all universal APIs (XP7 services)
 */
function getApis() { return getObjectList(path.resolve(RESOURCE_DIR, "apis")); }

/**
 * Get list of all tasks
 */
function getTasks() { return getObjectList(`${RESOURCE_DIR}/tasks`); }

/**
 * Returns a list of all filters
 */
function getFilters({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/filters`); }

/**
 * Returns a list of all filters
 */
function getProcessors({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/processors`); }

/**
 * Get list of all content types
 */
function getContentTypes({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/content-types`); }

/**
 * Get list of all parts
 */
function getParts({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/parts`); }

/**
 * Get list of all layouts
 */
function getLayouts({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/layouts`); }

/**
 * Get list of all mixins (XP8 `cms/mixins`, the XP7 "x-data" concept)
 */
function getMixins({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/mixins`); }

/**
 * Get list of all form-fragments (XP8 `cms/form-fragments`, the XP7 "mixin" concept)
 */
function getFormFragments({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/form-fragments`); }

/**
 * Get list of all pages
 */
function getPages({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/pages`); }

/**
 * Get list with site path and filename
 */
function getSite({ build = false } = {}) {
  const dir = build ? paths.BUILD_SITE_DIR : paths.SITE_DIR;
  const buildDir = build ? paths.SITE_DIR : paths.BUILD_SITE_DIR;
  const filename = findExistingFilename(dir, ["site.xml", "site.yaml", "cms.yaml"])
    || findExistingFilename(buildDir, ["site.xml", "site.yaml", "cms.yaml"]);

  if (!filename) return [];
  return [{
    name: "site", path: dir, buildPath: buildDir, filename
  }];
}

/**
 * List all Enonic XP standard format objects in a directory.
 * Standard format is [objectPath]/name-of-object/name-of-object.xml
 * @param {string} objectPath Path to directory
 */
function getObjectList(objectPath) {
  const directories = getDirectories(objectPath) || [];

  const objectList = directories.map((dirname) => {
    const name = `${path.basename(dirname)}`;
    const directory = dirname;
    const buildDirectory = directory.replace(SITE_DIR, BUILD_SITE_DIR);
    const candidates = [`${name}.xml`, `${name}.yaml`, `${name}.yml`];
    // Prefer a descriptor in source; fall back to the build mirror (e.g. a
    // `.yaml` compiled from a `.jsx` descriptor lives only in the build output).
    const filename = findExistingFilename(directory, candidates)
      || findExistingFilename(buildDirectory, candidates)
      || `${name}.xml`;

    return {
      name: name,
      path: directory,
      buildPath: buildDirectory,
      filename: filename
    };
  });
  return objectList;
}

export {
  getApis,
  getTasks,
  getFilters,
  getProcessors,
  getContentTypes,
  getParts,
  getLayouts,
  getMixins,
  getFormFragments,
  getPages,
  getSite
};
