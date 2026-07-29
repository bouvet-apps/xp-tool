import chokidar from "chokidar";
import * as jsxXml from "../../lib/jsx-xml/index.js";
import * as util from "../../lib/util/index.js";

// async function to enable await, making sure initial transpile run is ran first
export async function run() {
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
}
