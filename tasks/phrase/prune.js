const util = require("../../lib/util");
const checkMissingPhrases = require("./check-missing");
const tidyPhrases = require("./tidy");

// TODO: Move phrases analysis and manipulation to a new util library.

exports.run = (cfg) => {
  util.printHeader("Prune phrases");
  const results = checkMissingPhrases.analyze(cfg);

  // Ignore MIME-types and single-word phrases.
  const phrasesToDelete = results.phrasesNotUsed.filter((phrase) => {
    // Ignore MIME-type
    if (phrase.startsWith("application/")) {
      util.infoMessage(`Skipping unused media type '${phrase}'`);
      return false;
    }
    if (phrase.indexOf(".") === -1) {
      util.infoMessage(`Skipping unused single-word phrase '${phrase}'`);
      return false;
    }
    return true;
  });

  tidyPhrases.tidy(cfg, phrasesToDelete);
};
