const util = require("../../lib/util");

exports.run = () => {
  const mixins = util.getMixins();

  util.printHeader(`Mixins (${mixins.length})`);

  mixins.forEach((mixin) => {
    util.printBullet(mixin.name);
  });
};
