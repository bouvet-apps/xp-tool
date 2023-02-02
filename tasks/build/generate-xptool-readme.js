const fs = require("fs");
const path = require("path");

const util = require("../../lib/util");
const { tasks } = require("../../tasks");
const { version } = require("../../package.json");

exports.run = () => {
  util.printHeader("Generating xptool README.md");
  generate();
  util.successMessage("Done.");
};

/**
 * Generate README.md file from each tasks description field
 */
function generate() {
  let content = "";

  content += getIntro();

  getTypeList().forEach((type) => {
    getActionList(type).forEach((action) => {
      content += generateTask(type, action);
    });
  });

  fs.writeFileSync(path.resolve(__dirname, "../../README.md"), content, "utf8");
}

function getIntro() {
  const intro = `# xptool ${version}\n`
    + "```xptool``` is a tool for daily development needs in Enonic XP.\n\n"
    + "```npm install -g @bouvet-app/xp-tool```\n\n"
    + "For development of xp-tool, see [development.md](./docs/development.md).\n\n";
  return intro;
}

function getTypeList() { return Object.keys(tasks); }
function getActionList(type) { return tasks[type].map(action => action.action); }

/**
 * Generate markdown doc for each action of each task module. Skips actions that are hidden
 * @param {string} type Name of module, ie phrase, mixin, build
 * @param {string} action Name of action
 */
function generateTask(type, action) {
  let content = "";
  content += `## ${type}:${action}\n`;
  const task = getTaskDescriptor(type, action);

  // eslint-disable-next-line eqeqeq
  if ("hidden" in task && task.hidden == true) {
    util.warningMessage(`Not generating documentation for hidden task ${type}:${action}`);
    return "";
  }

  /* eslint-disable-next-line no-prototype-builtins */
  if ("description" in task) {
    util.successMessage(`Generated documentation for task ${type}:${action}`);
    content += task.description;
    content += "\n";
  } else {
    util.warningMessage(`No usage information defined for task ${type}:${action}`);
    content += "Not yet documented.\n  \n";
  }
  content += "\n**Syntax:**\n```\n";
  content += `xptool ${type} ${action}\n`;
  content += "```  \n  \n";
  return content;
}

function getTaskDescriptor(type, action) {
  const task = tasks[type].filter(t => t.action === action)[0];
  return task.descriptor;
}
