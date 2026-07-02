import * as util from "../../lib/util/index.js";

export function run() {
  const tasks = util.getTasks();

  util.printHeader(`Tasks (${tasks.length})`);

  tasks.forEach((task) => {
    util.printBullet(task.name);
  });
}
