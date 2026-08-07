import * as util from "../../lib/util/index.js";

export function run() {
  const mixins = util.getMixins();

  util.printHeader(`Mixins (${mixins.length})`);

  mixins.forEach((mixin) => {
    util.printBullet(mixin.name);
  });
}
