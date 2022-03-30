const util = require("../../lib/util");

exports.run = () => {
  const parts = util.getParts();

  util.printHeader(`Parts (${parts.length})`);

  parts.forEach((part) => {
    util.printBullet(part.name);
  });
};
