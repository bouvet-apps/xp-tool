import Table from "cli-table";
import * as util from "../../lib/util/index.js";

export function run() {
  const languages = util.getLanguages();

  const table = new Table({
    head: ["Filename", "Language", "Code"],
    colWidths: [60, 30, 10]
  });

  languages.map((language) => {
    table.push([language.filename, language.name, language.code]);
    return "";
  });
  console.log(table.toString());
}
