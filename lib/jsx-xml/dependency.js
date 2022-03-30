const { access } = require("fs").promises;
const { resolve } = require("path");

/**
 * Keeps track of dependency tree.
 * For each file, keep track of:
 *   Inbound -> Files that require this file
 *   Outbound -> Files that this file requires
 */
const dependencies = {};

function getDependancies(filePath) { return dependencies[filePath]; }

/**
 * Update a files inbound and outbound dependencies in dependency model
 * @param {string} filePath Path to target file
 * @param {string} fileContent Text content of target file
 */
async function updateDependencies(filePath, fileContent) {
  const outboundPaths = await getOutboundDependencies(filePath, fileContent);
  const absoluteFilePath = resolve("", filePath);

  let oldOutbound = [];

  // Update this's list of outbounds
  if (dependencies[absoluteFilePath]) {
    oldOutbound = [...dependencies[absoluteFilePath].outbound];
    dependencies[absoluteFilePath].outbound = outboundPaths;
  } else {
    dependencies[absoluteFilePath] = { outbound: outboundPaths, inbound: {} };
  }

  // Remove this as inbound from previous outbounds
  if (oldOutbound.length > 0) {
    for (const old of oldOutbound) {
      if (dependencies[old]) {
        dependencies[old].inbound[absoluteFilePath] = false;
      }
    }
  }

  // Add as inbound to new outbounds
  for (const outbound of outboundPaths) {
    if (dependencies[outbound]) {
      dependencies[outbound].inbound[absoluteFilePath] = true;
    } else {
      dependencies[outbound] = { outbound: [], inbound: { [absoluteFilePath]: true } };
    }
  }
}

/**
 * Gets all outbound dependencies in a file (the files that are used in require())
 * @param {string} filePath Path to target file
 * @param {string} fileContent Text content of target file
 */
async function getOutboundDependencies(filePath, fileContent) {
  const requireRegex = /(?:(?:\\['"`][\s\S])*?(['"`](?=[\s\S]*?require\s*\(['"`][^`"']+?[`'"]\)))(?:\\\1|[\s\S])*?\1|\s*(?:(?:var|const|let)?\s*([_.\w/$]+?)\s*=\s*)?require\s*\(([`'"])((?:@([^/]+?)\/([^/]*?)|[-.@\w/$]+?))\3(?:, ([`'"])([^\7]+?)\7)?\);?)/g;
  const outboundDependencies = [...fileContent.matchAll(requireRegex)].map(match => resolve("./", filePath, `../${match[4]}`));

  let outboundPaths = outboundDependencies.map(path => access(path).then(() => path).catch(() => false));
  outboundPaths = await Promise.all(outboundPaths);

  return outboundPaths.filter(Boolean);
}


module.exports = {
  getDependancies,
  updateDependencies,
  getOutboundDependencies
};
