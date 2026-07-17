import { run as generateRun } from "./generate.js";

export function run() {
  generateRun({ build: false });
}
