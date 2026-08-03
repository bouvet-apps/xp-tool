# Smoke Tests

This repository has no formal automated test suite, but it includes a repeatable smoke-test script for key XP8 path handling and task output.

## What It Covers

The script scaffolds a single XP8 fixture (`code/src/main/resources/cms`) and exercises:

- `part create` — asserts it produces XP8 YAML output (`<name>.yaml` with `kind: "Part"` and the `{ text, i18n }` title), a `.es6` controller and a `.ftl` view, and appends the display-name phrase to `phrases.properties`
- `part list` — asserts both hand-authored and generated parts are listed
- `phrase list-languages`
- `phrase check-missing`
- `documentation generate`

The fixture includes YAML descriptors (`cms.yaml` site descriptor and a
`content-types/article/article.yaml`) to verify that `documentation generate`
skips them gracefully instead of trying to parse YAML as XML, and a YAML-only
phrase reference to verify `check-missing` marks it as used (so `prune` won't
delete it).

## Run

```bash
bash scripts/smoke-test.sh
# or
npm run smoke
```

## Expected Result

- Script exits with code `0`
- Prints `PASS: XP8 part create`, `PASS: XP8 part list`, `PASS: XP8 read-only tasks`, `PASS: XP8 YAML i18n usage` and `All smoke tests passed.`

## Fixtures

The fixtures are **scaffolded into a throwaway temp directory at runtime** by
`scripts/smoke-test.sh` (and removed again when the script exits). They are not
committed because they live under a `code/` directory — the layout xptool
expects — which the repo `.gitignore` excludes. Generating them from the script
keeps the tests fully reproducible after a fresh clone with no working-tree
clutter.

The script is the single source of truth for the fixture contents:

- `xp8-minimal` — `code/src/main/resources/cms`

This is intentionally minimal and only intended for smoke testing.
