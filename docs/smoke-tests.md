# Smoke Tests

This repository has no formal automated test suite, but it includes a repeatable smoke-test script for key XP7/XP8 path handling.

## What It Covers

The script runs the most relevant commands in two fixtures:

- XP7 fixture using `code/src/main/resources/site`
- XP8 fixture using `code/src/main/resources/cms`

Commands exercised per fixture:

- `jsx-xml convert` (through task module)
- `phrase list-languages`
- `phrase check-missing`
- `documentation generate`

The XP8 fixture also includes YAML descriptors (`cms.yaml` site descriptor and a
`content-types/article/article.yaml`) to verify that `documentation generate`
skips them gracefully instead of trying to parse YAML as XML.

## Run

```bash
bash scripts/smoke-test.sh
# or
npm run smoke
```

## Expected Result

- Script exits with code `0`
- Prints `PASS: XP7`, `PASS: XP8` and `All smoke tests passed.`
- Generates `hello.xml.jsx` in each fixture under `.../parts/hello/`

## Fixtures

The fixtures are **scaffolded into a throwaway temp directory at runtime** by
`scripts/smoke-test.sh` (and removed again when the script exits). They are not
committed because they live under a `code/` directory — the layout xptool
expects — which the repo `.gitignore` excludes. Generating them from the script
keeps the tests fully reproducible after a fresh clone with no working-tree
clutter.

The script is the single source of truth for the fixture contents:

- `xp7-minimal` — `code/src/main/resources/site`
- `xp8-minimal` — `code/src/main/resources/cms`

These are intentionally minimal and only intended for smoke testing.
