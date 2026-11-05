"use strict";

/**
 * JSX → XP8 YAML runtime.
 *
 * Babel transforms `.jsx` descriptors with `@babel/plugin-transform-react-jsx`
 * (classic runtime, pragma `JSXYAML`, fragment `Fragment`). This module is the
 * runtime those transpiled files require: `JSXYAML(type, props, ...children)`
 * builds plain descriptor objects, and `render()` serializes the document to an
 * XP8 YAML descriptor string via js-yaml.
 *
 * Authoring model (Option A — clean XP8 vocabulary):
 *   - lowercase tags   = built-in form/descriptor vocabulary (interpreted here)
 *   - Capitalized tags = user components (functions returning arrays of nodes)
 */

const yaml = require("js-yaml");

// Fragment marker used as the JSX pragmaFrag.
const Fragment = Symbol("Fragment");

/**
 * Flatten nested/array children and drop empty values, so `.map()` output and
 * conditionals compose naturally.
 */
function flatten(children, out = []) {
  for (const child of children) {
    if (child === null || child === undefined || child === false || child === true || child === "") continue;
    if (Array.isArray(child)) flatten(child, out);
    else out.push(child);
  }
  return out;
}

function isNode(value) { return value && typeof value === "object" && typeof value._kind === "string"; }

/**
 * Split a builder's children into structured buckets.
 */
function collect(children) {
  const attrs = {};
  const items = [];
  const options = [];
  const regions = [];
  const comments = [];
  const text = [];

  for (const child of children) {
    if (typeof child === "string" || typeof child === "number") { text.push(String(child)); continue; }
    if (!isNode(child)) continue;

    switch (child._kind) {
      case "attr":
        attrs[child.key] = child.value;
        break;
      case "item":
        items.push(child.value);
        if (child.comments) comments.push(...child.comments);
        break;
      case "option":
        options.push(child.value);
        if (child.comments) comments.push(...child.comments);
        break;
      case "region":
        regions.push(child.value);
        break;
      case "comment":
        comments.push(...child.lines);
        break;
      default:
        break;
    }
  }

  return { attrs, items, options, regions, comments, text: text.join("").trim() };
}

/** Localizable value: `{ text, i18n }` when an i18n key is given, else plain text. */
function localizable(props, text) {
  const value = props.text !== undefined ? props.text : text;
  return props.i18n ? { text: value, i18n: props.i18n } : value;
}

/** Strip structural props so the remainder can be spread inline as item config. */
function configProps(props, exclude) {
  const config = {};
  for (const key of Object.keys(props)) {
    if (!exclude.includes(key)) config[key] = props[key];
  }
  return config;
}

function buildDescriptor(kind, props, children, extra = {}) {
  const { attrs, items, regions, comments } = collect(children);
  const value = { kind };

  Object.assign(value, extra);
  if (attrs.title !== undefined) value.title = attrs.title;
  if (attrs.description !== undefined) value.description = attrs.description;
  value.form = items;
  if (regions.length) value.regions = regions;

  return { _kind: "descriptor", value, comments };
}

const TAGS = {
  // ---- attribute-setting tags (consumed by the parent builder) ----
  title(props, children) {
    return { _kind: "attr", key: "title", value: localizable(props, collect(children).text) };
  },
  description(props, children) {
    return { _kind: "attr", key: "description", value: localizable(props, collect(children).text) };
  },
  label(props, children) {
    return { _kind: "attr", key: "label", value: localizable(props, collect(children).text) };
  },
  help(props, children) {
    return { _kind: "attr", key: "help-text", value: localizable(props, collect(children).text) };
  },
  "default": (props, children) => ({
    _kind: "attr", key: "default", value: props.value !== undefined ? props.value : collect(children).text
  }),
  occurrences(props) {
    const value = {};
    if (props.min !== undefined) value.min = Number(props.min);
    if (props.max !== undefined) value.max = Number(props.max);
    return { _kind: "attr", key: "occurrences", value };
  },
  region(props) {
    return { _kind: "region", value: props.name };
  },

  // ---- form items ----
  input(props, children) {
    const { attrs, comments } = collect(children);
    const { type, name } = props;
    const value = { type, name };
    if (attrs.label !== undefined) value.label = attrs.label;
    if (attrs["help-text"] !== undefined) value["help-text"] = attrs["help-text"];
    if (attrs.default !== undefined) value.default = attrs.default;
    Object.assign(value, configProps(props, ["type", "name"]));
    if (attrs.occurrences !== undefined) value.occurrences = attrs.occurrences;
    return { _kind: "item", value, comments };
  },
  "item-set": (props, children) => {
    const { attrs, items, comments } = collect(children);
    const value = { type: "ItemSet", name: props.name };
    if (attrs.label !== undefined) value.label = attrs.label;
    if (attrs["help-text"] !== undefined) value["help-text"] = attrs["help-text"];
    Object.assign(value, configProps(props, ["name"]));
    if (attrs.occurrences !== undefined) value.occurrences = attrs.occurrences;
    value.items = items;
    return { _kind: "item", value, comments };
  },
  "option-set": (props, children) => {
    const { attrs, options, comments } = collect(children);
    const value = { type: "OptionSet", name: props.name };
    if (attrs.label !== undefined) value.label = attrs.label;
    if (attrs["help-text"] !== undefined) value["help-text"] = attrs["help-text"];
    if (props.expanded !== undefined) value.expanded = props.expanded;
    Object.assign(value, configProps(props, ["name", "expanded", "selection"]));
    if (attrs.occurrences !== undefined) value.occurrences = attrs.occurrences;
    if (props.selection !== undefined) value.selection = props.selection;
    value.options = options;
    return { _kind: "item", value, comments };
  },
  option(props, children) {
    const { attrs, items, comments } = collect(children);
    const value = { name: props.name };
    if (attrs.label !== undefined) value.label = attrs.label;
    if (attrs["help-text"] !== undefined) value["help-text"] = attrs["help-text"];
    if (props.selected) value.selected = true;
    Object.assign(value, configProps(props, ["name", "selected"]));
    if (items.length) value.items = items;
    return { _kind: "option", value, comments };
  },
  "field-set": (props, children) => {
    const { attrs, items, comments } = collect(children);
    const value = { type: "FieldSet" };
    if (attrs.label !== undefined) value.label = attrs.label;
    value.items = items;
    return { _kind: "item", value, comments };
  },

  // ---- descriptor roots ----
  part: (props, children) => buildDescriptor("Part", props, children),
  layout: (props, children) => buildDescriptor("Layout", props, children),
  page: (props, children) => buildDescriptor("Page", props, children),
  "content-type": (props, children) => buildDescriptor("ContentType", props, children, {
    superType: props.superType || props["super-type"] || "base:structured"
  }),
  mixin: (props, children) => buildDescriptor("Mixin", props, children),
  "form-fragment": (props, children) => buildDescriptor("FormFragment", props, children)
};

/**
 * JSX pragma. Called for every JSX element in a transpiled descriptor.
 */
function JSXYAML(type, props, ...children) {
  const kids = flatten(children);

  if (type === Fragment) return kids;
  if (typeof type === "function") return type({ ...(props || {}), children: kids });

  const builder = TAGS[type];
  if (!builder) throw new Error(`Unknown JSX tag <${type}>`);
  return builder(props || {}, kids);
}

/** Documentation built-ins — emit leading YAML comments the docs generator reads. */
function Summary({ lang, text, children = [] }) {
  const value = text !== undefined ? text : flatten(children).join("");
  return { _kind: "comment", lines: [`@summary[${lang}]: ${value}`] };
}
function Description({ lang, text, children = [] }) {
  const value = text !== undefined ? text : flatten(children).join("");
  return { _kind: "comment", lines: [`@description[${lang}]: ${value}`] };
}
function Image({ src }) {
  return { _kind: "comment", lines: [`@image: ${src}`] };
}

const YAML_DUMP_OPTIONS = { lineWidth: -1, noRefs: true, quotingType: "\"" };

/**
 * Serialize a compiled document to an XP8 YAML descriptor string.
 * @param {Array|object} fragmentResult The Fragment result of a document's render() call.
 */
function render(fragmentResult) {
  const nodes = flatten(Array.isArray(fragmentResult) ? fragmentResult : [fragmentResult]);

  let descriptorNode = null;
  const comments = [];

  for (const node of nodes) {
    if (!isNode(node)) continue;
    if (node._kind === "descriptor") {
      descriptorNode = node;
      if (node.comments) comments.push(...node.comments);
    } else if (node._kind === "comment") {
      comments.push(...node.lines);
    } else if ((node._kind === "item" || node._kind === "option") && node.comments) {
      comments.push(...node.comments);
    }
  }

  if (!descriptorNode) {
    throw new Error("No descriptor root (part, layout, page, content-type, mixin or form-fragment) found in document");
  }

  const header = comments.length ? `${comments.map((line) => `# ${line}`).join("\n")}\n` : "";
  return header + yaml.dump(descriptorNode.value, YAML_DUMP_OPTIONS);
}

module.exports = {
  JSXYAML,
  Fragment,
  render,
  Summary,
  Description,
  Image,
  TAGS
};
