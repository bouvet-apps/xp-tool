const util = require("../../lib/util");

exports.run = () => {
  const xdata = util.getXData();

  util.printHeader(`X-Data (${xdata.length})`);

  xdata.forEach((item) => {
    util.printBullet(item.name);
  });
};
