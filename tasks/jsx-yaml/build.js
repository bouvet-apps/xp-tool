import * as jsxYaml from "../../lib/jsx-yaml/index.js";
import * as util from "../../lib/util/index.js";

export async function run() {
  util.printHeader(`Compiling files ${jsxYaml.JSX_GLOB_PATH}`);
  await jsxYaml.initialBuild({ exitOnError: true });
  util.infoMessage("Finished compiling to YAML");
}
