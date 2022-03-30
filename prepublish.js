const { run: generateXptoolReadme } = require("./tasks/build/generate-xptool-readme");
const { run: generateDist } = require("./tasks/jsx-xml/generate");

async function prepublish() {
  generateDist();
  generateXptoolReadme();
}
prepublish();
