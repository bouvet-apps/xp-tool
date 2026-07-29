import { run as generateXptoolReadme } from "./tasks/build/generate-xptool-readme.js";
import { run as generateDist } from "./tasks/jsx-xml/generate.js";

async function prepublish() {
  generateDist();
  generateXptoolReadme();
}
prepublish();
