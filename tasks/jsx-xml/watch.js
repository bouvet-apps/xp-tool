const chokidar = require("chokidar");
const jsxXml = require("../../lib/jsx-xml");

// async function to enable await, making sure initial transpile run is ran first
exports.run = async () => {
  console.log(`Starting JSX to XML compiler. Watching ${jsxXml.JSX_GLOB_PATH}`);
  await jsxXml.initialBuild();

  const fileWatcher = chokidar.watch(jsxXml.JSX_GLOB_PATH, {
    delay: 200,
    events: ["add", "change", "unlink"],
    ignored: [],
    ignoreInitial: true,
    queue: true
  });
  console.log("Watching for changes/new files...\n");

  fileWatcher.on("add", jsxXml.transformFile);
  fileWatcher.on("change", jsxXml.transformFile);
};
