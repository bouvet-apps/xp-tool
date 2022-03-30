const libs = {
  task: require("/lib/xp/task")
};

exports.run = () => {
  libs.task.progress({ info: "Initializing {{name}} task" });

  libs.task.progress({ info: "{{name}} task completed" });
};
