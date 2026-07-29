import * as util from "../../lib/util/index.js";

export function run() {
  const parts = util.getParts();

  util.printHeader(`Parts (${parts.length})`);

  parts.forEach((part) => {
    util.printBullet(part.name);
  });
}
