const path = require("path");

const { RESOURCE_DIR, SITE_DIR, BUILD_SITE_DIR } = require("./paths");
const { getDirectories } = require("./common");


/**
 * Returns a list of all services
 */
function getServices() { return getObjectList(path.resolve(RESOURCE_DIR, "services")); }

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
 * Get list of all x-data
 */
function getXData({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/x-data`); }

/**
 * Get list of all mixins
 */
function getMixins({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/mixins`); }

/**
 * Get list of all pages
 */
function getPages({ build = false } = {}) { return getObjectList(`${build ? BUILD_SITE_DIR : SITE_DIR}/pages`); }

/**
 * List all Enonic XP standard format objects in a directory.
 * Standard format is [objectPath]/name-of-object/name-of-object.xml
 * @param {string} objectPath Path to directory
 */
function getObjectList(objectPath) {
  const directories = getDirectories(objectPath) || [];

  const objectList = directories.map((dirname) => {
    const name = `${path.basename(dirname)}`;
    const filename = `${name}.xml`;
    const directory = dirname;

    return {
      name: name,
      path: directory,
      filename: filename
    };
  });
  return objectList;
}

module.exports = {
  getServices,
  getTasks,
  getFilters,
  getProcessors,
  getContentTypes,
  getParts,
  getLayouts,
  getXData,
  getMixins,
  getPages
};
