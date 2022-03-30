const util = require("../../lib/util");

exports.run = () => {
  const pages = util.getPages();

  util.printHeader(`Pages (${pages.length})`);

  pages.forEach((page) => {
    util.printBullet(page.name);
  });
};
