import chalk from "chalk";
import figures, { replaceSymbols } from "figures";

function clearConsole() {
  console.log("\x1Bc");
}

function printHeader(header) {
  console.log(`\n${chalk.bold.underline(header)}`);
}

function printBullet(message) {
  console.log(`  ${figures.bullet} ${chalk.green(message)}`);
}

function successMessage(message) {
  console.log(replaceSymbols(`  ${chalk.green("✔")}︎ ${chalk.bold(message)}`));
}

function infoMessage(message) {
  console.log(replaceSymbols(`  ${chalk.blue("ℹ")} ${chalk.bold(message)}`));
}

function errorMessage(message) {
  console.error(replaceSymbols(`  ${chalk.red("✖")} ${chalk.bold(message)}`));
}

function warningMessage(message) {
  console.warn(replaceSymbols(`  ${chalk.yellow("⚠")} ${chalk.bold(message)}`));
}

export {
  clearConsole,
  printHeader,
  printBullet,
  successMessage,
  infoMessage,
  errorMessage,
  warningMessage
};
