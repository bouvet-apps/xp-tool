const util = require("../../lib/util");

exports.run = () => {
  const tasks = util.getTasks();

  util.printHeader(`Tasks (${tasks.length})`);

  tasks.forEach((task) => {
    util.printBullet(task.name);
  });
};
