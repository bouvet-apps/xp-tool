const chalk = require("chalk");
const figures = require("figures");

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
  console.log(figures(`  ${chalk.green("✔")}︎ ${chalk.bold(message)}`));
}

function infoMessage(message) {
  console.log(figures(`  ${chalk.blue("ℹ")} ${chalk.bold(message)}`));
}

function errorMessage(message) {
  console.error(figures(`  ${chalk.red("✖")} ${chalk.bold(message)}`));
}

function warningMessage(message) {
  console.warn(figures(`  ${chalk.yellow("⚠")} ${chalk.bold(message)}`));
}

module.exports = {
  clearConsole,
  printHeader,
  printBullet,
  successMessage,
  infoMessage,
  errorMessage,
  warningMessage
};
