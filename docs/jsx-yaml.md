# JSX-YAML

xptool lets you write Enonic XP 8 descriptors (content types, parts, layouts,
pages, mixins, form-fragments) as JSX components. The `jsx-yaml build` command
compiles them to standard XP 8 YAML descriptors in the build directory.

> JSX gives you real JavaScript while authoring: imports, props with defaults,
> component composition, `.map()`, conditionals — things a plain `.yaml` file
> cannot express. The output is ordinary XP 8 YAML.

## Commands

| Command | Description |
|---------|-------------|
| `xptool jsx-yaml build` | Compile all `.jsx` descriptors to YAML once |
| `xptool jsx-yaml watch` | Watch for changes and recompile automatically |

## File extension

Descriptors use the `.jsx` extension and are picked up from
`src/main/resources/**/*.jsx`. Each descriptor compiles to a sibling `.yaml`
file in `build/resources/main/…`.

## The vocabulary

Files are transpiled by Babel with the pragma `JSXYAML` (from
[lib/jsx-yaml/runtime.cjs](../lib/jsx-yaml/runtime.cjs)). You never import the
runtime yourself — the compact `<jsx>` wrapper (below) wires it up.

Two kinds of tags:

- **lowercase tags** are the built-in XP 8 vocabulary, interpreted by the
  compiler.
- **Capitalized tags** are your own components — functions that return form
  items (see [Components](#components)).

### Descriptor roots

| Tag | `kind:` |
|-----|---------|
| `<part>` | `Part` |
| `<layout>` | `Layout` |
| `<page>` | `Page` |
| `<content-type>` | `ContentType` (adds `superType`, default `base:structured`) |
| `<mixin>` | `Mixin` |
| `<form-fragment>` | `FormFragment` |

### Form items

| Tag | Produces |
|-----|----------|
| `<input type name …config>` | a typed input; extra props become inline config |
| `<item-set name>` | `type: ItemSet` with nested `items` |
| `<option-set name expanded selection={{min,max}}>` | `type: OptionSet` |
| `<option name selected>` | an option (optionally with nested `items`) |
| `<field-set>` | `type: FieldSet` (visual grouping, no `name`) |

### Attribute tags (set a property on the parent)

| Tag | Sets |
|-----|------|
| `<title i18n>` | descriptor `title` (localizable) |
| `<description>` | descriptor `description` |
| `<label i18n>` | item `label` (localizable) |
| `<help i18n>` | item `help-text` (localizable) |
| `<occurrences min max/>` | item `occurrences` |
| `<default value/>` | item `default` |
| `<region name/>` | a layout/page region |

Localizable tags accept an `i18n` prop and emit the XP 8 `{ text, i18n }` shape:

```jsx
<label i18n="article.title">Title</label>
```
```yaml
label:
  text: Title
  i18n: article.title
```

Config that has no dedicated tag is passed as extra props on `<input>`; arrays
are written with JS interpolation:

```jsx
<input type="ContentSelector" name="ref" allowContentType={["article"]} treeMode>
  <label>Reference</label>
</input>
```

## Compact format

A file starting with `<jsx` is automatically expanded before transpiling. This
is the normal way to author descriptors.

```jsx
<jsx>
  <content-type superType="base:structured">
    <title i18n="article.displayName">Article</title>
    <input type="TextLine" name="title">
      <label i18n="article.title">Title</label>
      <occurrences min={1} max={1} />
    </input>
  </content-type>
</jsx>
```

compiles to:

```yaml
kind: ContentType
superType: base:structured
title:
  text: Article
  i18n: article.displayName
form:
  - type: TextLine
    name: title
    label:
      text: Title
      i18n: article.title
    occurrences:
      min: 1
      max: 1
```

### Imports

To use components or plain JS models, add `<import>` tags inside the `<jsx>`
wrapper:

```jsx
<jsx>
  <import component="TitleField" path="./title-field" />
  <import model="articleData" path="./article-model" export="getData" />

  <content-type>
    <title>Article</title>
    <TitleField label="Headline" />
  </content-type>
</jsx>
```

`component` imports use `require()`; `model` imports use `requireUncached()`
(cache-busted on every build, useful for data that changes during watch mode).

## Components

To create a **reusable component**, add a `name` attribute (and optional `props`
with defaults). A component returns one or more form items — compose it inside
descriptors or other components.

```jsx
<jsx name="TitleField" props={{ label = "Title" }}>
  <input type="TextLine" name="title">
    <label>{label}</label>
    <occurrences min={1} max={1} />
  </input>
</jsx>
```

Named files export a function instead of a compiled string, so they produce no
`.yaml` of their own — they are only consumed by importing files.

## Built-in components

`Summary`, `Description`, and `Image` are always available — no import required.
They emit YAML comments read by the documentation generator.

```jsx
<Summary lang="en">This is an article content type.</Summary>
<Description lang="en">Detailed description of the content type.</Description>
<Image src="images/article-screenshot.png" />
```

- `Summary` / `Description` — props: `lang` (required), `children` or `text`.
- `Image` — prop: `src` (required).

## Custom templates

xptool looks for the boilerplate template in three locations, in priority order:

1. `.xptool/templates/boilerplate/boilerplate.jsx` — project-specific override
2. `~/.xptool/templates/boilerplate/boilerplate.jsx` — user-default override
3. Built-in tool template

To customise it, copy `templates/boilerplate/boilerplate.jsx` from the xptool
repo into `.xptool/templates/boilerplate/` in your project.
