import * as util from "../../lib/util/index.js";

export function run() {
  util.printHeader("Content types");

  util.getContentTypes().forEach((ct) => {
    util.printBullet(ct.name);
  });
}
