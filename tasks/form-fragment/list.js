import * as util from "../../lib/util/index.js";

export function run() {
  const formFragments = util.getFormFragments();

  util.printHeader(`Form fragments (${formFragments.length})`);

  formFragments.forEach((formFragment) => {
    util.printBullet(formFragment.name);
  });
}
