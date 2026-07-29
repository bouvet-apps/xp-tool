import * as util from "../../lib/util/index.js";

export function run() {
  const xdata = util.getXData();

  util.printHeader(`X-Data (${xdata.length})`);

  xdata.forEach((item) => {
    util.printBullet(item.name);
  });
}
