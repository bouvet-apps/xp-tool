# xp-tool — Agent Instructions

**xptool** is a CLI development utility for [Enonic XP](https://enonic.com/) that automates creation of XP components, manages i18n phrases, and compiles JSX-to-XML. Published as `@bouvet-apps/xp-tool` on npm; installed globally as `xptool`.

## Commands

```bash
npm run lint        # ESLint (airbnb config)
node xptool.js      # Run locally without global install
```

There are no automated tests. The `prepublishOnly` script runs `node prepublish.js`.

## Architecture

| Entry point | Description |
|---|---|
| [xptool.js](xptool.js) | CLI entry — parses args with `minimist`, routes to tasks |
| [tasks.js](tasks.js) | Scans `tasks/` and builds task registry |
| [lib/util/](lib/util/) | Shared utilities (paths, templates, i18n, console) |
| [lib/jsx-xml/](lib/jsx-xml/) | JSX-to-XML Babel compiler |
| [lib/subproject.js](lib/subproject.js) | Subproject detection via `.subproject.json` |
| [templates/](templates/) | Handlebars templates for generated files |
| [i18n/](i18n/) | Tool's own i18n strings (not project i18n) |

## Task Structure

Every task lives in `tasks/<type>/<action>.{json,js}`:

- **`<action>.json`** — descriptor with a `description` field
- **`<action>.js`** — exports two functions:
  - `getConfig()` → array of [enquirer](https://github.com/enquirer/enquirer) prompt objects; each has `argument`, `type`, `message`, `validate`
  - `run(config)` → executes the task with collected input

**Prompt types**: use `type: "string"` for text, `type: "phrase"` for multi-language i18n values (returns `{ en: "...", no: "..." }`).

**Validators**: reuse `util.VALIDATORS.nospace` and `util.VALIDATORS.cron` from [lib/util/constants.js](lib/util/constants.js).

See [tasks/part/create.js](tasks/part/create.js) as the canonical example for component creation tasks.

## Templates

Handlebars templates in `templates/<type>/`. Resolution order (first found wins):

1. `.xptool/templates/` (project-local overrides)
2. `~/.xptool/templates/` (user overrides)
3. `templates/` (tool defaults — this repo)

Render via `util.renderTemplate(name, type, model, destination)` from [lib/util/template.js](lib/util/template.js).

## Project Detection

[lib/util/paths.js](lib/util/paths.js) walks up from `cwd` looking for `gradle.properties` or a `code/` directory to determine `BASE_DIR`, `SITE_DIR`, `CODE_DIR`, `RESOURCE_DIR`, and `BUILD_SITE_DIR`.

## i18n (Project Phrases)

[lib/util/i18n.js](lib/util/i18n.js) manages Enonic XP project phrase files at `site/i18n/phrases.properties` (English) and `phrases_<code>.properties` (other languages). Use `addPhrase(key, phraseObject)` to append to all language files at once.

## Adding a New Task

1. Create `tasks/<type>/<action>.json` → `{ "description": "..." }`
2. Create `tasks/<type>/<action>.js` → export `getConfig()` and `run(config)`
3. Add templates to `templates/<type>/` if the task generates files
4. `tasks.js` discovers the new task automatically — no registration needed

## Key Utilities

| Import | Purpose |
|---|---|
| `util.successMessage(msg)` / `util.errorMessage(msg)` | Colored console output |
| `util.VALIDATORS` | Built-in enquirer validators |
| `util.renderTemplate(name, type, model, dest)` | Handlebars file generation |
| `util.paths.*` | Project-relative directory paths |
| `util.getLanguages()` | List detected i18n language files |
