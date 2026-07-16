import fs from "fs";
import path from "path";
import xml from "pixl-xml";
import cronstrue from "cronstrue";
import Table from "cli-table";

import { RESOURCE_DIR, printHeader } from "../../lib/util/index.js";

export function run() {
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
}
