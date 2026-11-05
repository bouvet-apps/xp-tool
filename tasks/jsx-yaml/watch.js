import chokidar from "chokidar";
import * as jsxYaml from "../../lib/jsx-yaml/index.js";
import * as util from "../../lib/util/index.js";

// async function to enable await, making sure initial transpile run is ran first
export async function run() {
  util.infoMessage(`Starting JSX to YAML compiler. Watching ${jsxYaml.JSX_GLOB_PATH}`);
  await jsxYaml.initialBuild();

  const fileWatcher = chokidar.watch(jsxYaml.JSX_GLOB_PATH, {
    delay: 200,
    events: ["add", "change", "unlink"],
    ignored: [],
    ignoreInitial: true,
    queue: true
  });
  util.infoMessage("Watching for changes/new files...\n");

  fileWatcher.on("add", (p) => jsxYaml.transformFile(p).catch((err) => util.errorMessage(err.message)));
  fileWatcher.on("change", (p) => jsxYaml.transformFile(p).catch((err) => util.errorMessage(err.message)));
}
