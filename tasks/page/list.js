import * as util from "../../lib/util/index.js";

export function run() {
  const pages = util.getPages();

  util.printHeader(`Pages (${pages.length})`);

  pages.forEach((page) => {
    util.printBullet(page.name);
  });
}
