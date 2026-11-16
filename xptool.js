#!/usr/bin/env node
import { createRequire } from "module";
import minimist from "minimist";
import Enquirer from "enquirer";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import chalk from "chalk";

import { tasks } from "./tasks.js";
import { getLanguages, printHeader } from "./lib/util/index.js";

const require = createRequire(import.meta.url);
const { version } = require("./package.json");

const enquirer = new Enquirer();

marked.use(markedTerminal());

const args = minimist(process.argv.slice(2), {
  alias: {
    h: "help",
    v: "version"
  }
});

/**
 * Print ASCII Bouvet logo to console :)
 */
function displayLogo() {
  console.log(chalk.rgb(255, 100, 0)(
    " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////                                                                                                                                            *////(      \n"
    + " #/////  &(///////(/%                 &(////////((&          *****/              /****/  /**/**(               (****//       &(////////(%          */////***** \n"
    + " #////////////////////(%            (////////////////        *////(              *////(   //////%             %//////     %////////////////%       *////////// \n"
    + " #///////////////////////&        ////////////////////(      *////(              *////(    //////%            //////*   %////////////////////(     *////////// \n"
    + " #////////*        *///////     (///////*       .(//////(    *////(              *////(     //////           ///////   *//////(        *///////%   *////(      \n"
    + " #//////(            (//////   (//////,            //////(   *////(              *////(      //////         ///////   ///////       &%/////////,   *////(      \n"
    + " #//////              //////(  //////.              /////*   *////(              *////(       //////       (//////   %//////     &(///////////     *////(      \n"
    + " #/////               ,/////(  //////               ./////   *////(              *////(       ./////(     %//////    ///////    ///////////        *////(      \n"
    + " (/////#              */////(  /////*               */////   *////(              (////(        ///////    //////,    ///////    ///////*           *////(      \n"
    + " .//////              //////   (/////(              //////   //////             (/////*         //////*  //////*      ///////             (/%      *////(      \n"
    + "  ///////%           ///////    ///////%          (//////     //////(          (//////           ///////%//////       *//////(          %*/////(   (/////%     \n"
    + "   ////////(&    %////////*      /////////&   &(////////       ////////(&  &((///////             ////////////         ,////////(&   %/////////     //////*(   \n"
    + "    .////////////////////         *///////////////////*         ///////////////////(               //////////            (///////////////////.       ///////// \n"
    + "       (//////////////(             ,///////////////(             (///////////////                 .////////.              ///////////////(           //////// \n"
    + "           ,///(//.                      ./////,                      ,*(/(/*.                        ///(.                    ,*/(///,                   */(/ "
  ));
}

/**
 * Get path for task component by type and action.
 */
function getComponentPath(type, action) {
  const task = tasks[type].filter(t => t.action === action)[0];
  return `./tasks/${task.component}`;
}

/**
 * Get task component by type and action.
 */
async function getComponent(type, action) {
  return import(getComponentPath(type, action));
}

/**
 * Get actions for task by type.
 */
function getActionList(type) { return tasks[type].filter(action => action.descriptor.hidden !== true).map(action => action.action); }

// eslint-disable-next-line eqeqeq
function getTypeListExcludeHidden() { return Object.keys(tasks).filter(taskGroup => !tasks[taskGroup].every(a => a.descriptor.hidden == true)); }

/**
 * Validate task type and action.
 */
function validateAction(type, action) {
  if (!action) return false;
  return getActionList(type).includes(action);
}

/**
 * Validate task type.
 */
function validateType(type) {
  if (!type) return false;
  /* eslint-disable-next-line no-prototype-builtins */
  return tasks.hasOwnProperty(type);
}

/**
 * Print help to console.
 */
function displayHelp() {
  displayLogo();
  printHeader("Usage:");
  console.log("usage: npm start -- \n   [-v | -version]\n   [-h | -help]\n");
}

/**
 * Print version number to console.
 */
function displayVersion() {
  console.log(version);
}

if (args.help) {
  const type = args._[0];
  const action = args._[1];

  if (validateAction(type, action) && validateType(type)) {
    const taskDescriptor = tasks[type].filter(t => t.action === action)[0].descriptor;
    /* eslint-disable-next-line no-prototype-builtins */
    if ("description" in taskDescriptor) {
      console.log(marked.parse(taskDescriptor.description));
    } else {
      console.log("No usage information defined for task");
    }
  } else {
    displayHelp();
  }

  process.exit();
}

if (args.version) {
  displayVersion();
  process.exit();
}

async function promptTaskConfig(type, action) {
  let questions = {};

  const taskConfig = {
    type: type,
    action: action
  };

  if (!validateType(taskConfig.type)) {
    questions = [{
      type: "select", name: "type", message: "Choose type", choices: getTypeListExcludeHidden()
    }];
    const answers = await enquirer.prompt(questions);
    taskConfig.type = answers.type;
  }

  if (!validateAction(taskConfig.type, taskConfig.action)) {
    questions = [{
      type: "select", name: "action", message: "Choose action", choices: getActionList(taskConfig.type)
    }];
    const answers = await enquirer.prompt(questions);
    taskConfig.action = answers.action;
  }
  return taskConfig;
}

async function main() {
  try {
    const type = args._[0];
    const action = args._[1];
    const verbose = args.verbose;

    if (!validateType(type) || !validateAction(action)) {
      const taskConfig = await promptTaskConfig(type, action);

      const task = await getComponent(taskConfig.type, taskConfig.action);

      if (task.getConfig && typeof (task.getConfig) === "function") {
        const configParameters = task.getConfig();

        const typeMap = {
          string: "input",
          phrase: "form",
          number: "numeral"
        };

        const questions = configParameters.map((param) => {
          const result = {
            type: typeMap[param.type]
          };

          if (param.validate && typeof (param.validate) === "function") {
            result.validate = param.validate;
          }

          if (param.type === "phrase") {
            result.choices = getLanguages().map(language => ({
              name: language.code,
              message: language.name
            }));
          }

          result.message = param.message;
          result.name = param.argument;

          return result;
        });
        const config = await enquirer.prompt(questions);

        config.verbose = verbose;
        config.args = args;
        task.run(config);
      } else {
        const config = { verbose: verbose, args: args };
        task.run(config);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
main();
