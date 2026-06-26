#!/usr/bin/env bash
set -euo pipefail

# Smoke tests for XP7 (/site) and XP8 (/cms) resource structures.
#
# Fixtures are scaffolded into a throwaway temp directory at runtime so the
# tests are fully reproducible after a fresh clone. They intentionally live
# under a `code/` directory (the layout xptool expects), which is why they are
# generated here instead of being committed (the repo .gitignore excludes
# `code/`).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WORK_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t xptool-smoke)"
trap 'rm -rf "$WORK_DIR"' EXIT

# Scaffold the parts shared by every fixture, parameterised by resource dir.
scaffold_common() {
  local root="$1"   # fixture root
  local res="$2"    # "site" or "cms"
  local src="$root/code/src/main/resources/$res"
  local build="$root/code/build/resources/main/$res"

  # documentation generate reads project docs from here.
  mkdir -p "$root/code/src/docs/no"

  # Project phrases (used by list-languages, check-missing, convert).
  mkdir -p "$src/i18n"
  cat > "$src/i18n/phrases.properties" <<'EOF'
part.hello.displayName = Hello part
site.displayName = Demo site
EOF
  cat > "$src/i18n/phrases_no.properties" <<'EOF'
part.hello.displayName = Hei del
site.displayName = Demo side
EOF

  # Part descriptor (converted to JSX, documented).
  mkdir -p "$src/parts/hello"
  cat > "$src/parts/hello/hello.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<part>
    <display-name i18n="part.hello.displayName">Hello part</display-name>
    <form/>
</part>
EOF

  # Build mirror (documentation generate runs with build=true by default).
  mkdir -p "$build/parts/hello"
  cp "$src/parts/hello/hello.xml" "$build/parts/hello/hello.xml"
}

scaffold_xp7() {
  local root="$1"
  scaffold_common "$root" "site"

  cat > "$root/code/src/main/resources/site/site.xml" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<site>
    <display-name i18n="site.displayName">Demo site</display-name>
    <form/>
</site>
EOF
  cp "$root/code/src/main/resources/site/site.xml" \
    "$root/code/build/resources/main/site/site.xml"
}

scaffold_xp8() {
  local root="$1"
  scaffold_common "$root" "cms"

  # XP8 site descriptor is YAML; documentation generate must skip it.
  printf 'kind: Site\n' > "$root/code/src/main/resources/cms/cms.yaml"
  cp "$root/code/src/main/resources/cms/cms.yaml" \
    "$root/code/build/resources/main/cms/cms.yaml"

  # XP8 YAML content-type; documentation generate must skip it (not crash).
  mkdir -p "$root/code/build/resources/main/cms/content-types/article"
  printf 'kind: ContentType\n' > \
    "$root/code/build/resources/main/cms/content-types/article/article.yaml"

  # XP8 YAML part that references a phrase via the { text, i18n } pattern.
  # check-missing must mark this phrase as used (so prune won't delete it).
  printf 'part.world.displayName = World part\n' >> \
    "$root/code/src/main/resources/cms/i18n/phrases.properties"
  printf 'part.world.displayName = Verden del\n' >> \
    "$root/code/src/main/resources/cms/i18n/phrases_no.properties"
  mkdir -p "$root/code/src/main/resources/cms/parts/world"
  cat > "$root/code/src/main/resources/cms/parts/world/world.yaml" <<'EOF'
kind: Part
title:
  text: "World part"
  i18n: "part.world.displayName"
form: []
EOF
}

run_node_task() {
  local fixture="$1"
  local task_module="$2"
  local method="$3"
  local config_js="$4"

  node -e "(async () => {
    process.chdir('${fixture}');
    const task = require('${ROOT_DIR}/${task_module}');
    const result = task['${method}'](${config_js});
    if (result && typeof result.then === 'function') {
      await result;
    }
  })().catch((err) => { console.error(err); process.exit(1); });"
}

run_fixture() {
  local name="$1"
  local fixture="$2"
  local res="$3"

  echo ""
  echo "=== Smoke test: ${name} ==="

  echo "[1/4] jsx-xml convert"
  run_node_task "$fixture" "tasks/jsx-xml/convert.js" "run" "{ delete: '', verbose: false, args: {} }"

  echo "[2/4] phrase list-languages"
  run_node_task "$fixture" "tasks/phrase/list-languages.js" "run" "{ verbose: false, args: {} }"

  echo "[3/4] phrase check-missing"
  run_node_task "$fixture" "tasks/phrase/check-missing.js" "run" "{ verbose: false, args: {} }"

  echo "[4/4] documentation generate"
  run_node_task "$fixture" "tasks/documentation/generate.js" "run" "{}"

  if [[ ! -f "${fixture}/code/src/main/resources/${res}/parts/hello/hello.xml.jsx" ]]; then
    echo "ERROR: Expected converted JSX file not found for ${name}" >&2
    exit 1
  fi

  echo "PASS: ${name}"
}

# Verify check-missing marks i18n keys referenced from XP8 YAML descriptors as
# used (so `prune` won't delete them).
assert_yaml_i18n_used() {
  local fixture="$1"

  echo ""
  echo "=== Smoke test: XP8 YAML i18n usage ==="
  node -e "
    process.chdir('${fixture}');
    const task = require('${ROOT_DIR}/tasks/phrase/check-missing.js');
    const results = task.analyze({ verbose: false, args: {} });
    const key = 'part.world.displayName';
    if (!results.phrasesUsed.includes(key)) {
      console.error('ERROR: ' + key + ' (referenced only from YAML) not marked as used');
      process.exit(1);
    }
    if (results.phrasesNotUsed.includes(key)) {
      console.error('ERROR: ' + key + ' wrongly listed as unused (prune would delete it)');
      process.exit(1);
    }
  "
  echo "PASS: XP8 YAML i18n usage"
}

XP7_DIR="$WORK_DIR/xp7-minimal"
XP8_DIR="$WORK_DIR/xp8-minimal"

scaffold_xp7 "$XP7_DIR"
scaffold_xp8 "$XP8_DIR"

run_fixture "XP7" "$XP7_DIR" "site"
run_fixture "XP8" "$XP8_DIR" "cms"
assert_yaml_i18n_used "$XP8_DIR"

echo ""
echo "All smoke tests passed."
