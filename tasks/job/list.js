const fs = require("fs");
const path = require("path");
const xml = require("pixl-xml");
const cronstrue = require("cronstrue");
const Table = require("cli-table");

const { RESOURCE_DIR, printHeader } = require("../../lib/util");

exports.run = () => {
  printHeader("Jobs");

  const jobsDirectory = path.resolve(RESOURCE_DIR, "jobs");

  const jobsFilename = path.resolve(jobsDirectory, "jobs.xml");
  let jobsDoc;

  if (fs.existsSync(jobsFilename)) {
    const jobsContent = fs.readFileSync(jobsFilename, "utf-8");
    jobsDoc = xml.parse(jobsContent,
      { preserveAttributes: true, preserveDocumentNode: true, forceArrays: true });

    // Display list in a table
    const table = new Table({
      head: ["Job", "Cron schedule", "Explanation"],
      colWidths: [20, 20, 60]
    });

    jobsDoc.jobs.job.forEach((job) => {
      table.push([job._Attribs.name, job._Attribs.cron, cronstrue.toString(job._Attribs.cron)]);
    });

    console.log(table.toString());
  } else {
    console.log("Jobs file does not exist.");
  }
};
