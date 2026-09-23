/**
 * Extract `@summary` / `@description` documentation comments from raw XP8 YAML
 * descriptor text.
 *
 * `js-yaml` (and most YAML parsers) discard comments, so these cannot be read
 * from a parsed document. Instead we scan the raw text line by line and
 * associate each comment with the field it documents.
 *
 * Association rule: a comment belongs to the field whose `name:` key sits at
 * the SAME indentation and is the NEAREST such key (above or below) the
 * comment. This covers both orderings seen in the wild —
 *
 *   - name: "key"
 *     # @description[no]: ...
 *
 * and
 *
 *     # @description[no]: ...
 *     name: "key"
 *
 * Repeated field names (e.g. several `type:` fields) never collide because
 * each comment is matched to its own nearest `name:` line.
 *
 * A comment with no `name:` key at its indentation (e.g. a top-level
 * `# @summary[no]:` before `kind:`) is attributed to the document root,
 * reported as `field: null`.
 */

const DOC_TAG = /^\s*#\s*@(summary|description)(?:\[([a-zA-Z-]+)\])?:\s*(.*)$/;
const NAME_KEY = /^\s*(?:-\s+)?name:\s*(.*)$/;

/**
 * Effective indentation of a line: its leading whitespace, plus 2 when the line
 * is a sequence item (`- ...`), since the item's content sits two columns in
 * from the dash. This lets a comment at the item's indentation match a `name:`
 * key written on the dash line (e.g. `- name: "internal"`).
 */
function effectiveIndent(line) {
  const base = line.length - line.trimStart().length;
  return line.trimStart().startsWith("- ") ? base + 2 : base;
}

/** Strip surrounding quotes from a YAML scalar. */
function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && ((trimmed[0] === '"' && trimmed[trimmed.length - 1] === '"') || (trimmed[0] === "'" && trimmed[trimmed.length - 1] === "'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * Extract documentation comments from raw YAML text.
 *
 * @param {string} yamlText Raw YAML descriptor text.
 * @returns {Array<{tag: string, language: string|null, text: string, line: number, field: string|null}>}
 *   One entry per documentation comment, in file order. `line` is the 1-based
 *   line number of the comment. `field` is the associated field name, or `null`
 *   for a document-root comment.
 */
function extractDocComments(yamlText) {
  const lines = yamlText.split(/\r?\n/);

  // Pre-compute every `name:` key with its effective indentation and 1-based line number.
  const nameKeys = [];
  lines.forEach((line, index) => {
    const match = line.match(NAME_KEY);
    if (match) {
      nameKeys.push({ indent: effectiveIndent(line), line: index + 1, name: unquote(match[1]) });
    }
  });

  const comments = [];
  lines.forEach((line, index) => {
    const match = line.match(DOC_TAG);
    if (!match) return;

    const [, tag, language, text] = match;
    const indent = effectiveIndent(line);

    // Nearest `name:` key at the same indentation, above or below the comment.
    let nearest = null;
    nameKeys.forEach((key) => {
      if (key.indent !== indent) return;
      const distance = Math.abs(key.line - (index + 1));
      if (nearest === null || distance < nearest.distance) {
        nearest = { distance, name: key.name };
      }
    });

    comments.push({
      tag,
      language: language || null,
      text: text.trim(),
      line: index + 1,
      field: nearest ? nearest.name : null
    });
  });

  return comments;
}

export { extractDocComments };
