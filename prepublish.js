import { run as generateXptoolReadme } from "./tasks/build/generate-xptool-readme.js";

async function prepublish() {
  generateXptoolReadme();
}
prepublish();
