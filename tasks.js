const fs = require("fs");
const path = require("path");

const TASKS_PATH = path.resolve(__dirname, "./tasks");

const TASK_DESCRIPTOR_EXTENSION = ".json";
const TASK_EXTENSION = ".js";

function getDirectories(source) {
  return fs.readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

/**
 * Get tasks from modules/{group_name}/{action_name}.js
 */
function getActions() {
  const actions = {};
  const groups = getDirectories(TASKS_PATH);
  groups.sort().forEach((group) => {
    // Get list of js files
    const files = fs.readdirSync(path.join(TASKS_PATH, group))
      .filter(f => f.endsWith(TASK_DESCRIPTOR_EXTENSION));

    const a = files.map((f) => {
      const baseFilename = f.substr(0, f.indexOf(TASK_DESCRIPTOR_EXTENSION));
      const taskFilename = `${path.join(group, baseFilename)}${TASK_EXTENSION}`;
      return {
        action: f.substr(0, f.indexOf(TASK_DESCRIPTOR_EXTENSION)),
        component: taskFilename,
        descriptor: JSON.parse(fs.readFileSync(path.resolve(TASKS_PATH, group, f)))// path.join(group, f)
      };
    });

    if (a.length > 0) actions[group] = a;
  });

  // console.log(JSON.stringify(actions, null, 2));

  return actions;
}

exports.tasks = getActions();
