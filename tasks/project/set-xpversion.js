const path = require("path");
const { orderBy } = require("natural-orderby");
const enquirer = require("enquirer");
const fs = require("fs");
const util = require("../../lib/util");

exports.run = async () => {
  util.printHeader("Set Enonic XP version");
  const version = await promptVersion();

  updateDockerfile(version);
  updateGradleProperties(version);
};

/**
 * Prompt user for desired version number.
 */
async function promptVersion() {
  const tags = await getTagsFromGithub();
  const versions = tags
    .map(t => t.name.replace(/^v/, ""))
    .filter(name => !name.includes("SNAPSHOT"));

  const sorted = orderBy(versions, [v => v], ["desc"]).slice(0, 12);

  const questions = [{
    type: "select", name: "version", message: "Choose version", choices: sorted
  }];
  const answers = await enquirer.prompt(questions);

  return answers.version;
}

/**
 * Fetch version tags from github.
 */
async function getTagsFromGithub() {
  const { default: fetch } = await import("node-fetch");
  const response = await fetch("https://api.github.com/repos/enonic/docker-xp/tags?per_page=50");
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Failed to fetch versions from GitHub: ${data.message || "unknown error"}`);
  }
  return data;
}

/**
 * Update version number in Dockerfile.
 *
 * @param {string} version Version number to set.
 */
function updateDockerfile(version) {
  const filename = path.resolve(util.BASE_DIR, "enonic-server/exp/Dockerfile");

  if (!fs.existsSync(filename)) {
    util.warningMessage(`Dockerfile not found at ${filename}, skipping`);
    return;
  }

  let content = fs.readFileSync(filename, "utf8");
  const regex = /^(FROM\s+enonic\/xp-app:).*$/gm;
  content = content.replace(regex, `$1${version}`);
  fs.writeFileSync(filename, content, "utf8");

  util.successMessage(`Updated version number to ${version} in exp/Dockerfile`);
}

/**
 * Update version number in gradle.properties.
 *
 * @param {string} version Version number to set.
 */
function updateGradleProperties(version) {
  const filename = path.resolve(util.BASE_DIR, "code/gradle.properties");

  if (!fs.existsSync(filename)) {
    util.warningMessage(`gradle.properties not found at ${filename}, skipping`);
    return;
  }

  let content = fs.readFileSync(filename, "utf8");
  const regex = /^(xpVersion\s+=\s+).*$/gm;
  content = content.replace(regex, `$1${version}`);
  fs.writeFileSync(filename, content, "utf8");

  util.successMessage(`Updated version number to ${version} in gradle.properties`);
}
exports.updateGradleProperties = updateGradleProperties;
