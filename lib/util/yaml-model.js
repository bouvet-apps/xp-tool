/**
 * Build a documentation field model from a parsed YAML field object.
 *
 * The model shape matches what the Handlebars templates expect (same as the
 * old XML path produced):
 *   { type, name, description, image, min, max, requiredText, other,
 *     options, items, configOptions }
 *
 * @param {object} yamlField  A single field object from the parsed YAML `form` array.
 * @param {Array}  comments   Result of `extractDocComments()` for the whole file.
 * @param {string} language   Language code (e.g. "no").
 * @param {object} phrases    propertiesReader instance for project i18n.
 * @param {object} userdocPhrases  propertiesReader instance for tool i18n.
 * @returns {object} Field model object.
 */
function buildFieldModel(yamlField, comments, language, phrases, userdocPhrases) {
  const field = {
    type: yamlField.type || "",
    name: resolveLabel(yamlField.label, phrases),
    description: getComment(comments, yamlField.name, "description", language),
    image: getComment(comments, yamlField.name, "image", language),
    min: 0,
    max: 1
  };

  // Occurrences
  if (yamlField.occurrences) {
    const min = yamlField.occurrences.min;
    const max = yamlField.occurrences.max;
    if (min === max && min > 0) {
      field.other = userdocPhrases.get("required");
      field.requiredText = userdocPhrases.get("yes");
    } else {
      field.requiredText = userdocPhrases.get("no");
    }
    if (min === max && min === 0) field.other = userdocPhrases.get("infinite");
    field.max = (max === 0) ? userdocPhrases.get("infinite") : max;
    field.min = min;
  }

  // OptionSet → options array
  if (yamlField.type === "OptionSet" && Array.isArray(yamlField.options)) {
    field.options = yamlField.options.map((opt) => buildOptionModel(opt, comments, language, phrases, userdocPhrases));
  }

  // FieldSet / ItemSet → items array (recursive)
  if ((yamlField.type === "FieldSet" || yamlField.type === "ItemSet") && Array.isArray(yamlField.items)) {
    field.items = yamlField.items.map((sub) => buildFieldModel(sub, comments, language, phrases, userdocPhrases));
  }

  return field;
}

/**
 * Build a model for a single option within an OptionSet.
 */
function buildOptionModel(opt, comments, language, phrases, userdocPhrases) {
  const option = {
    label: resolveLabel(opt.label, phrases),
    description: getComment(comments, opt.name, "description", language),
    image: getComment(comments, opt.name, "image", language),
    fields: []
  };

  if (Array.isArray(opt.items)) {
    option.fields = opt.items.map((sub) => buildFieldModel(sub, comments, language, phrases, userdocPhrases));
  }

  return option;
}

/**
 * Resolve a YAML `label` value (string or {text, i18n}) to display text.
 */
function resolveLabel(label, phrases) {
  if (!label) return "";
  if (typeof label === "string") return label;
  if (label.i18n && phrases) {
    const phrase = phrases.get(label.i18n);
    if (phrase) return phrase;
  }
  return label.text || "";
}

/**
 * Look up a documentation comment for a given field name, tag and language.
 * Falls back to the tag without language if no language-specific comment exists.
 */
function getComment(comments, fieldName, tag, language) {
  if (!fieldName) return "";
  const match = comments.find(c => c.field === fieldName && c.tag === tag && c.language === language);
  if (match) return match.text;
  // Fallback: no language qualifier
  const fallback = comments.find(c => c.field === fieldName && c.tag === tag && c.language === null);
  if (fallback) return fallback.text;
  return "";
}

export { buildFieldModel };
