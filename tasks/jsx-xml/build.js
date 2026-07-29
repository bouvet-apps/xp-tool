import * as jsxXml from "../../lib/jsx-xml/index.js";
import * as util from "../../lib/util/index.js";

export async function run() {
  util.printHeader(`Compiling files ${jsxXml.JSX_GLOB_PATH}`);
  await jsxXml.initialBuild({ exitOnError: true });
  util.infoMessage("Finished compiling to XML");
}
