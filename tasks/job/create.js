const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const xml = require("pixl-xml");
const util = require("../../lib/util");

const { RESOURCE_DIR } = util;

const type = "job";

exports.getConfig = () => [
  {
    argument: "name",
    type: "string",
    message: "Enter name (no spaces)",
    validate: util.VALIDATORS.nospace
  }, {
    argument: "cron",
    type: "string",
    message: "Enter cron schedule",
    validate: util.VALIDATORS.cron
  }
];

exports.run = (config) => {
  const name = config.name;
  const cron = config.cron;

  const jobsDirectory = path.resolve(RESOURCE_DIR, "jobs");

  util.printHeader(`Creating ${type} '${name}' in ${jobsDirectory}`);

  // Create jobs and target directories if they don't exist
  fse.ensureDirSync(jobsDirectory);

  // Create model for template
  const model = {
    name: name
  };

  // Render template
  util.renderTemplate(type, "es6", model, `${jobsDirectory}/${name}.es6`);

  // Add job to jobs/jobs.xml
  const jobsFilename = path.resolve(jobsDirectory, "jobs.xml");
  let jobsDoc;

  if (fs.existsSync(jobsFilename)) {
    const jobsContent = fs.readFileSync(jobsFilename, "utf-8");
    jobsDoc = xml.parse(jobsContent,
      { preserveAttributes: true, preserveDocumentNode: true, forceArrays: true });

    // Check if we already have the job defined
    const node = jobsDoc.jobs.job.filter(job => job._Attribs.name === name);

    if (node.length < 1) {
      const job = {
        _Attribs: {
          name: name,
          cron: cron
        }
      };

      jobsDoc.jobs.job.push(job);

      const xmlString = xml.stringify(jobsDoc).replace("<?xml version=\"1.0\"?>\n", "");
      fs.writeFileSync(jobsFilename, xmlString);

      util.successMessage(`Job with name '${name}' added to ${jobsFilename}`);
    } else {
      util.infoMessage(`Job with name '${name}' was already defined in ${jobsFilename}`);
    }
  } else {
    jobsDoc = {
      jobs: {
        job: [
          {
            _Attribs: {
              cron: cron,
              name: name
            }
          }
        ]
      }
    };
    const xmlString = xml.stringify(jobsDoc).replace("<?xml version=\"1.0\"?>\n", "");
    fs.writeFileSync(jobsFilename, xmlString);

    util.successMessage(`Job with name '${name}' added to ${jobsFilename}`);
  }
};
