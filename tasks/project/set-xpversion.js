const fetch = require("node-fetch");
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
  let response = await getListFromGithub();
  response = response.filter(e => e.type === "dir" && e.name !== "SNAPSHOT");
  response = orderBy(
    response,
    [v => v.name],
    ["desc"]
  );

  const versions = response.map(value => value.name).slice(0, 12); // Top 12
  const questions = [{
    type: "select", name: "version", message: "Choose version", choices: versions
  }];
  const answers = await enquirer.prompt(questions);

  return answers.version;
}

/**
 * Fetch directory listing from github.
 */
async function getListFromGithub() {
  const response = await fetch("https://api.github.com/repos/enonic/docker-xp/contents/xp-app");
  const data = await response.json();
  return data;
}

/**
 * Update version number in Dockerfile.
 *
 * @param {string} version Version number to set.
 */
function updateDockerfile(version) {
  const filename = path.resolve(util.BASE_DIR, "enonic-server/exp/Dockerfile");

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

  let content = fs.readFileSync(filename, "utf8");
  const regex = /^(xpVersion\s+=\s+).*$/gm;
  content = content.replace(regex, `$1${version}`);
  fs.writeFileSync(filename, content, "utf8");

  util.successMessage(`Updated version number to ${version} in gradle.properties`);
}
exports.updateGradleProperties = updateGradleProperties;
