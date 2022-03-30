const util = require("../../lib/util");

exports.run = () => {
  util.printHeader("Content types");

  util.getContentTypes().forEach((ct) => {
    util.printBullet(ct.name);
  });
};
