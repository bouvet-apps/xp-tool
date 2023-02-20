#!/usr/bin/env node
const minimist = require("minimist");
const Enquirer = require("enquirer");
const marked = require("marked");
const TerminalRenderer = require("marked-terminal");
const chalk = require("chalk");

const { tasks } = require("./tasks");
const { getLanguages, printHeader } = require("./lib/util");
const { version } = require("./package.json");

const enquirer = new Enquirer();

const args = minimist(process.argv.slice(2), {
  alias: {
    h: "help",
    v: "version"
  }
});

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
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
 *
 * @param {string} type Task type
 * @param {string} action Task action
 */
function getComponentPath(type, action) {
  const task = tasks[type].filter(t => t.action === action)[0];
  return `./tasks/${task.component}`;
}

/**
 * Get task component by type and action.
 *
 * @param {string} type Task type
 * @param {string} action Task action
 */
/* eslint-disable-next-line import/no-dynamic-require */
function getComponent(type, action) { return require(getComponentPath(type, action)); }

/**
 * Get actions for task by type.
 *
 * @param {string} type Task type
 * @returns Array of action strings for type
 */
function getActionList(type) { return tasks[type].filter(action => action.descriptor.hidden !== true).map(action => action.action); }

// eslint-disable-next-line eqeqeq
function getTypeListExcludeHidden() { return Object.keys(tasks).filter(taskGroup => !tasks[taskGroup].every(a => a.descriptor.hidden == true)); }

/**
 * Validate task type and action.
 *
 * @param {string} type Task type
 * @param {string} action Task action
 * @returns true if type is valid and has action
 */
function validateAction(type, action) {
  if (!action) return false;
  return getActionList(type).includes(action);
}

/**
 * Validate task type.
 *
 * @param {string} type Task type
 * @returns true if type is valid.
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
    // const task = getComponent(type, action);

    const taskDescriptor = tasks[type].filter(t => t.action === action)[0].descriptor;
    /* eslint-disable-next-line no-prototype-builtins */
    if ("description" in taskDescriptor) {
      console.log(marked(taskDescriptor.description));
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

      // Get task component
      const task = getComponent(taskConfig.type, taskConfig.action);

      if (task.getConfig && typeof (task.getConfig) === "function") {
        const configParameters = task.getConfig();

        // Build questions for specific task config
        const typeMap = {
          string: "input",
          phrase: "form",
          number: "numeral"
        };

        const questions = configParameters.map((param) => {
          const result = {
            type: typeMap[param.type]
          };

          // If we have a validator, add it
          if (param.validate && typeof (param.validate) === "function") {
            result.validate = param.validate;
          }

          // Expand phrases into a form
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
exports.main = main;
main();
