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
 * Returns a list of all services
 */
function getServices() { return getObjectList(path.resolve(RESOURCE_DIR, "services")); }

/**
 * Returns a list of all universal APIs
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
  const primary = build ? paths.BUILD_SITE_DIR : paths.SITE_DIR;
  const found = findDescriptor(primary, mirrorOf(primary), ["cms.yaml", "site.yaml", "site.xml"]);

  if (!found) return [];
  return [{ name: "site", ...found }];
}

/**
 * The same location on the other side of the source/build split (`cms/` <-> `build/resources/main/cms/`).
 * Paths outside the site directory have no mirror.
 */
function mirrorOf(dir) {
  if (dir.startsWith(SITE_DIR)) return BUILD_SITE_DIR + dir.slice(SITE_DIR.length);
  if (dir.startsWith(BUILD_SITE_DIR)) return SITE_DIR + dir.slice(BUILD_SITE_DIR.length);
  return dir;
}

/**
 * Find a descriptor in `primary`, falling back to `secondary`. `path` is the directory it was
 * found in, so callers can read `path/filename` directly; `buildPath` is the other directory.
 */
function findDescriptor(primary, secondary, candidates) {
  const inPrimary = findExistingFilename(primary, candidates);
  if (inPrimary) return { path: primary, buildPath: secondary, filename: inPrimary };
  const inSecondary = findExistingFilename(secondary, candidates);
  if (inSecondary) return { path: secondary, buildPath: primary, filename: inSecondary };
  return null;
}

/**
 * List all Enonic XP standard format objects in a directory and its source/build mirror.
 * Standard format is [objectPath]/name-of-object/name-of-object.{xml,yaml,yml}.
 * Source and build are merged because each may hold descriptors the other lacks: a `.yaml`
 * compiled from `.jsx` exists only in build, a hand-written `.yaml` only in source until
 * Gradle copies it.
 * @param {string} objectPath Path to directory
 */
function getObjectList(objectPath) {
  const mirrorPath = mirrorOf(objectPath);
  const names = new Set([...getDirectories(objectPath), ...getDirectories(mirrorPath)]
    .map((dirname) => path.basename(dirname)));

  return [...names].sort().map((name) => {
    const directory = path.resolve(objectPath, name);
    const buildDirectory = path.resolve(mirrorPath, name);
    const found = findDescriptor(directory, buildDirectory, [`${name}.xml`, `${name}.yaml`, `${name}.yml`]);

    return {
      name,
      ...(found || { path: directory, buildPath: buildDirectory, filename: `${name}.xml` })
    };
  });
}

export {
  getServices,
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
