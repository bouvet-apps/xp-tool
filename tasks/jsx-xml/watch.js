const chokidar = require("chokidar");
const jsxXml = require("../../lib/jsx-xml");
const util = require("../../lib/util");

// async function to enable await, making sure initial transpile run is ran first
exports.run = async () => {
  util.infoMessage(`Starting JSX to XML compiler. Watching ${jsxXml.JSX_GLOB_PATH}`);
  await jsxXml.initialBuild();

  const fileWatcher = chokidar.watch(jsxXml.JSX_GLOB_PATH, {
    delay: 200,
    events: ["add", "change", "unlink"],
    ignored: [],
    ignoreInitial: true,
    queue: true
  });
  util.infoMessage("Watching for changes/new files...\n");

  fileWatcher.on("add", (p) => jsxXml.transformFile(p).catch((err) => util.errorMessage(err.message)));
  fileWatcher.on("change", (p) => jsxXml.transformFile(p).catch((err) => util.errorMessage(err.message)));
};
