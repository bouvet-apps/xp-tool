const jsxXml = require("../../lib/jsx-xml");
const util = require("../../lib/util");

exports.run = async () => {
  util.printHeader(`Compiling files ${jsxXml.JSX_GLOB_PATH}`);
  await jsxXml.initialBuild({ exitOnError: true });
  util.infoMessage("Finished compiling to XML");
};
