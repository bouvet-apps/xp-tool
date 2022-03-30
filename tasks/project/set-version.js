const enquirer = require("enquirer");
const fs = require("fs");
const path = require("path");
const marked = require("marked");
const util = require("../../lib/util");

const VERSIONING_HELP = "### Semantic versioning for our projects\n"
  + "Format: **MAJOR**.**MINOR**.**PATCH**_-commit_hash_\n\n"
  + "#### Development phase:\n"
  + " * **MAJOR** version: 0\n"
  + " * **MINOR** version: Active sprint number\n"
  + " * **PATCH** version: As needed\n\n"
  + "#### Maintenance phase:\n"
  + " * **MAJOR** version: Major change/release\n"
  + " * **MINOR** version: Enonic XP or other dependency version change\n"
  + " * **PATCH** version: Minor change without Enonic XP or dependency version change\n\n"
  + "Git commit hash is automatically appended by the build system.\n";

const GRADLE_PROPERTIES_FILENAME = path.resolve(util.BASE_DIR, "code/gradle.properties");


exports.run = async () => {
  util.printHeader("Set project version");
  console.log(`\n${marked(VERSIONING_HELP)}`);
  const version = await promptVersion();

  updateGradleProperties(version);
};

/**
 * Prompt user for desired version number.
 */
async function promptVersion() {
  const currentVersion = await getCurrentVersion();
  console.log(`Current version is ${currentVersion}`);
  const versionArray = currentVersion.split(".");

  let major = 0;
  let minor = 0;
  let patch = 0;

  versionArray.forEach((number, i) => {
    if (i === 0) major = number;
    else if (i === 1) minor = number;
    else if (i === 2) patch = number;
  });
  minor++;
  patch = 0;
  const suggestion = `${major}.${minor}.${patch}`;

  const questions = [{
    type: "input", name: "version", message: "Type version number", initial: suggestion
  }];
  const answers = await enquirer.prompt(questions);

  return answers.version;
}

function getCurrentVersion() {
  const content = fs.readFileSync(GRADLE_PROPERTIES_FILENAME, "utf8");
  const regex = /^version\s+=\s+(.*)$/gm;
  const matches = regex.exec(content);
  return matches[1];
}

/**
 * Update version number in gradle.properties.
 *
 * @param {string} version Version number to set.
 */
function updateGradleProperties(version) {
  let content = fs.readFileSync(GRADLE_PROPERTIES_FILENAME, "utf8");
  const regex = /^(version\s+=\s+).*$/gm;
  content = content.replace(regex, `$1${version}`);
  fs.writeFileSync(GRADLE_PROPERTIES_FILENAME, content, "utf8");

  util.successMessage(`Updated version number to ${version} in gradle.properties`);
}
