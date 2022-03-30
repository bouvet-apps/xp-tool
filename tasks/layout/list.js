const util = require("../../lib/util");

exports.run = () => {
  const layouts = util.getLayouts();

  util.printHeader(`Layouts (${layouts.length})`);

  layouts.forEach((layout) => {
    util.printBullet(layout.name);
  });
};
