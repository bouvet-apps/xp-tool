import * as util from "../../lib/util/index.js";

export function run() {
  const layouts = util.getLayouts();

  util.printHeader(`Layouts (${layouts.length})`);

  layouts.forEach((layout) => {
    util.printBullet(layout.name);
  });
}
