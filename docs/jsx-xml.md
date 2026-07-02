# JSX-XML

xptool lets you write Enonic XP XML descriptors (content types, parts, pages, layouts) as JSX components. The `jsx-xml build` command compiles them to standard XML files in the build directory.

## Commands

| Command | Description |
|---------|-------------|
| `xptool jsx-xml build` | Compile all JSX files to XML once |
| `xptool jsx-xml watch` | Watch for changes and recompile automatically |
| `xptool jsx-xml convert` | Convert existing XML files in `/site` to JSX |

## File extension

The default file extension is `.xml.jsx`. Files are picked up from `src/main/resources/**/*<extension>`.

You can change the extension per project by creating `.xptool/config.json` at the project root:

```json
{
  "jsxXml": {
    "extension": "default"
  }
}
```

| Value | Extension |
|-------|-----------|
| `"default"` | `.xml.jsx` |
| `"alternative"` | `.jsxxml` |
| `"short"` | `.jsx` |

## The JSXXML pragma

These files use `JSXXML` from the `jsx-xml` package as the JSX factory — not `React.createElement`. The pragma comment `/** @jsx JSXXML */` tells Babel which function to use.

`jsx-xml` exports: `JSXXML`, `Fragment`, `Comment`, `render`, and XML element helpers.

## Full format

The full format gives you complete control. Use it for reusable components that other files import.

```jsx
/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const { JSXXML, Fragment, render } = jsxxml;

const _document = render(
  <Fragment>
    <content-type>
      <display-name>Article</display-name>
      <form>
        <input type="TextLine" name="title">
          <label>Title</label>
          <occurrences minimum="1" maximum="1" />
        </input>
      </form>
    </content-type>
  </Fragment>
).end({ prettyPrint: true, headless: true });

module.exports = _document;
```

For a **reusable component** (imported by other files), export a function instead of a rendered string:

```jsx
/** @jsx JSXXML */
const jsxxml = require("jsx-xml");

const { JSXXML } = jsxxml;

const TitleField = ({ label = "Title" }) => (
  <input type="TextLine" name="title">
    <label>{label}</label>
    <occurrences minimum="1" maximum="1" />
  </input>
);

module.exports = TitleField;
```

## Compact format

The compact format reduces boilerplate. A file starting with `<jsx` is automatically expanded to the full format before transpiling.

```xml
<jsx type="compact">
  <content-type>
    <display-name>Article</display-name>
    <form>
      <input type="TextLine" name="title">
        <label>Title</label>
        <occurrences minimum="1" maximum="1" />
      </input>
    </form>
  </content-type>
</jsx>
```

To import components or models, use `<import>` tags inside the `<jsx>` wrapper:

```xml
<jsx type="compact">
  <import component="TitleField" path="./title-field" />
  <import model="articleData" path="./article-model" export="getData" />

  <content-type>
    <display-name>Article</display-name>
    <form>
      <TitleField label="Headline" />
    </form>
  </content-type>
</jsx>
```

`component` imports use `require()`, `model` imports use `requireUncached()` (cache-busted on every build, useful for data that changes during watch mode).

To create a **reusable component** in compact format, add a `name` attribute:

```xml
<jsx name="TitleField" type="compact">
  <input type="TextLine" name="title">
    <label>Title</label>
    <occurrences minimum="1" maximum="1" />
  </input>
</jsx>
```

## Built-in components

`Summary`, `Image`, and `Description` are always available in every file — no import required.

### Summary

Renders an `@summary` comment used by the documentation generator.

```jsx
<Summary lang="en">This is an article content type.</Summary>
```

Props: `lang` (required), `children` or `text`.

### Description

Renders an `@description` comment used by the documentation generator.

```jsx
<Description lang="en">Detailed description of the content type.</Description>
```

Props: `lang` (required), `children` or `text`.

### Image

Renders an `@image` comment linking a screenshot to the documentation.

```jsx
<Image src="images/article-screenshot.png" />
```

Props: `src` (required).

## Custom templates

xptool looks for templates in three locations, in priority order:

1. `.xptool/templates/<name>/<name>.xml.jsx` — project-specific override
2. `~/.xptool/templates/<name>/<name>.xml.jsx` — user-default override
3. Built-in tool templates

To customise the boilerplate template, copy `templates/boilerplate/boilerplate.xml.jsx` from the xptool repo to `.xptool/templates/boilerplate/` in your project.
