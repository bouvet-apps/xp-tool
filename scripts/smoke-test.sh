#!/usr/bin/env bash
set -euo pipefail

# Smoke tests for the XP8 (/cms) resource structure.
#
# Fixtures are scaffolded into a throwaway temp directory at runtime so the
# tests are fully reproducible after a fresh clone. They intentionally live
# under a `code/` directory (the layout xptool expects), which is why they are
# generated here instead of being committed (the repo .gitignore excludes
# `code/`).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WORK_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t xptool-smoke)"
trap 'rm -rf "$WORK_DIR"' EXIT

# Scaffold a minimal XP8 (cms) fixture into a throwaway directory.
scaffold_fixture() {
  local root="$1"
  local src="$root/code/src/main/resources/cms"
  local build="$root/code/build/resources/main/cms"

  # documentation generate reads project docs from here.
  mkdir -p "$root/code/src/docs/no"

  # Project phrases (used by list-languages, check-missing, part/create).
  mkdir -p "$src/i18n"
  cat > "$src/i18n/phrases.properties" <<'EOF'
part.hello.displayName = Hello part
part.world.displayName = World part
part.promo.displayName = Promo part
site.displayName = Demo site
EOF
  cat > "$src/i18n/phrases_no.properties" <<'EOF'
part.hello.displayName = Hei del
part.world.displayName = Verden del
part.promo.displayName = Promo del
site.displayName = Demo side
EOF

  # Hand-authored YAML parts referencing phrases via the { text, i18n } pattern.
  mkdir -p "$src/parts/hello"
  cat > "$src/parts/hello/hello.yaml" <<'EOF'
kind: "Part"
title:
  text: "Hello part"
  i18n: "part.hello.displayName"
form: []
EOF
  mkdir -p "$src/parts/world"
  cat > "$src/parts/world/world.yaml" <<'EOF'
kind: "Part"
title:
  text: "World part"
  i18n: "part.world.displayName"
form: []
EOF

  # Hand-authored mixin + form-fragment so their list tasks have something to show
  # (there are no create tasks for these types).
  mkdir -p "$src/mixins/seo"
  cat > "$src/mixins/seo/seo.yaml" <<'EOF'
kind: "Mixin"
title: "SEO"
form: []
EOF
  mkdir -p "$src/form-fragments/address"
  cat > "$src/form-fragments/address/address.yaml" <<'EOF'
kind: "FormFragment"
title: "Address"
form: []
EOF

  # gradle.properties — api/list reads appName from here to build API URLs.
  cat > "$root/code/gradle.properties" <<'EOF'
appName = com.example.smoke
version = 1.0.0
EOF

  # Site descriptor (YAML) — documentation generate must skip it.
  printf 'kind: Site\n' > "$src/cms.yaml"

  # Build mirror (documentation generate runs with build=true by default).
  mkdir -p "$build/parts/hello" "$build/parts/world"
  cp "$src/parts/hello/hello.yaml" "$build/parts/hello/hello.yaml"
  cp "$src/parts/world/world.yaml" "$build/parts/world/world.yaml"
  cp "$src/cms.yaml" "$build/cms.yaml"

  # YAML content-type in build only — documentation generate must skip it.
  mkdir -p "$build/content-types/article"
  printf 'kind: ContentType\n' > "$build/content-types/article/article.yaml"
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

# Scaffold a part with part/create and assert it produced XP8 YAML output.
assert_part_create() {
  local fixture="$1"
  local cms="$fixture/code/src/main/resources/cms"

  echo ""
  echo "=== Smoke test: XP8 part create ==="
  run_node_task "$fixture" "tasks/part/create.js" "run" \
    "{ name: 'hero', displayName: { en: 'Hero', no: 'Helt' } }"

  local f
  for f in parts/hero/hero.yaml parts/hero/hero.es6 parts/hero/hero.ftl; do
    if [[ ! -f "$cms/$f" ]]; then
      echo "ERROR: part/create did not produce $f" >&2
      exit 1
    fi
  done
  if ! grep -q 'kind: "Part"' "$cms/parts/hero/hero.yaml"; then
    echo "ERROR: hero.yaml missing 'kind: \"Part\"'" >&2
    exit 1
  fi
  if ! grep -q 'i18n: "hero.displayName"' "$cms/parts/hero/hero.yaml"; then
    echo "ERROR: hero.yaml missing i18n reference" >&2
    exit 1
  fi
  if ! grep -q 'hero.displayName' "$cms/i18n/phrases.properties"; then
    echo "ERROR: hero.displayName phrase not added" >&2
    exit 1
  fi
  echo "PASS: XP8 part create"
}

# Scaffold layout + content-type and assert they produce XP8 YAML descriptors.
assert_component_create() {
  local fixture="$1"
  local cms="$fixture/code/src/main/resources/cms"

  echo ""
  echo "=== Smoke test: XP8 component create ==="

  run_node_task "$fixture" "tasks/layout/create.js" "run" \
    "{ name: 'banner', displayName: { en: 'Banner', no: 'Banner' }, columns: 2 }"
  if ! grep -q 'kind: "Layout"' "$cms/layouts/banner/banner.yaml"; then
    echo "ERROR: banner.yaml missing 'kind: \"Layout\"'" >&2
    exit 1
  fi
  if ! grep -q 'left' "$cms/layouts/banner/banner.yaml"; then
    echo "ERROR: banner.yaml missing regions" >&2
    exit 1
  fi

  run_node_task "$fixture" "tasks/content-type/create.js" "run" \
    "{ name: 'author', displayName: { en: 'Author', no: 'Forfatter' } }"
  if ! grep -q 'kind: "ContentType"' "$cms/content-types/author/author.yaml"; then
    echo "ERROR: author.yaml missing 'kind: \"ContentType\"'" >&2
    exit 1
  fi

  echo "PASS: XP8 component create"
}

# Compile a .jsx descriptor to an XP8 YAML descriptor via the jsx-yaml build task.
assert_jsx_yaml_build() {
  local fixture="$1"
  local src="$fixture/code/src/main/resources/cms"
  local build="$fixture/code/build/resources/main/cms"

  echo ""
  echo "=== Smoke test: JSX to YAML compile ==="

  mkdir -p "$src/parts/promo"
  cat > "$src/parts/promo/promo.jsx" <<'EOF'
<jsx>
  <part>
    <title i18n="part.promo.displayName">Promo</title>
    <input type="TextLine" name="heading">
      <label>Heading</label>
      <occurrences min={1} max={1} />
    </input>
    <item-set name="slides">
      <label>Slides</label>
      <occurrences min={0} max={0} />
      <input type="ImageSelector" name="image">
        <label>Image</label>
      </input>
    </item-set>
  </part>
</jsx>
EOF

  run_node_task "$fixture" "tasks/jsx-yaml/build.js" "run" "{}"

  local out="$build/parts/promo/promo.yaml"
  if [[ ! -f "$out" ]]; then
    echo "ERROR: jsx-yaml build did not produce promo.yaml" >&2
    exit 1
  fi
  if ! grep -q 'kind: Part' "$out"; then
    echo "ERROR: promo.yaml missing 'kind: Part'" >&2
    exit 1
  fi
  if ! grep -q 'type: ItemSet' "$out"; then
    echo "ERROR: promo.yaml missing 'type: ItemSet'" >&2
    exit 1
  fi
  if ! grep -q 'i18n: part.promo.displayName' "$out"; then
    echo "ERROR: promo.yaml missing i18n reference" >&2
    exit 1
  fi
  if [[ -f "$build/parts/promo/promo.jsx" ]]; then
    echo "ERROR: intermediate promo.jsx not cleaned from build output" >&2
    exit 1
  fi
  echo "PASS: JSX to YAML compile"
}

# part/list must include both the hand-authored and the generated parts.
assert_part_list() {
  local fixture="$1"

  echo ""
  echo "=== Smoke test: XP8 part list ==="
  local out
  out="$(run_node_task "$fixture" "tasks/part/list.js" "run" "{}")"
  echo "$out"
  local p
  for p in hello world hero; do
    if ! echo "$out" | grep -q "$p"; then
      echo "ERROR: part/list missing '$p'" >&2
      exit 1
    fi
  done
  echo "PASS: XP8 part list"
}

# Exercise the read-only tasks that must not crash on an XP8 project.
run_readonly_tasks() {
  local fixture="$1"

  echo ""
  echo "=== Smoke test: XP8 read-only tasks ==="

  echo "[1/3] phrase list-languages"
  run_node_task "$fixture" "tasks/phrase/list-languages.js" "run" "{ verbose: false, args: {} }"

  echo "[2/3] phrase check-missing"
  run_node_task "$fixture" "tasks/phrase/check-missing.js" "run" "{ verbose: false, args: {} }"

  echo "[3/3] documentation generate"
  run_node_task "$fixture" "tasks/documentation/generate.js" "run" "{}"

  echo "PASS: XP8 read-only tasks"
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

# Create a page, a universal API and a task; assert each produced its XP8 YAML.
assert_more_creates() {
  local fixture="$1"
  local cms="$fixture/code/src/main/resources/cms"
  local res="$fixture/code/src/main/resources"

  echo ""
  echo "=== Smoke test: XP8 page/api/task create ==="

  run_node_task "$fixture" "tasks/page/create.js" "run" \
    "{ name: 'frontpage', displayName: { en: 'Front page', no: 'Forside' } }"
  if ! grep -q 'kind: "Page"' "$cms/pages/frontpage/frontpage.yaml"; then
    echo "ERROR: frontpage.yaml missing 'kind: \"Page\"'" >&2
    exit 1
  fi

  run_node_task "$fixture" "tasks/api/create.js" "run" "{ name: 'feed' }"
  if ! grep -q 'kind: "API"' "$res/apis/feed/feed.yaml"; then
    echo "ERROR: feed.yaml missing 'kind: \"API\"'" >&2
    exit 1
  fi

  run_node_task "$fixture" "tasks/task/create.js" "run" \
    "{ name: 'reindex', description: 'Reindex content' }"
  if ! grep -q 'kind: "Task"' "$res/tasks/reindex/reindex.yaml"; then
    echo "ERROR: reindex.yaml missing 'kind: \"Task\"'" >&2
    exit 1
  fi
  echo "PASS: XP8 page/api/task create"
}

# Run every list task and assert it finds the expected component (verifies the
# XP8 YAML read path across all component types).
assert_component_lists() {
  local fixture="$1"
  local out

  echo ""
  echo "=== Smoke test: XP8 component lists ==="

  out="$(run_node_task "$fixture" "tasks/page/list.js" "run" "{}")"
  echo "$out" | grep -q 'frontpage' || { echo "ERROR: page/list missing frontpage" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/api/list.js" "run" "{}")"
  echo "$out" | grep -q 'feed' || { echo "ERROR: api/list missing feed" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/task/list.js" "run" "{}")"
  echo "$out" | grep -q 'reindex' || { echo "ERROR: task/list missing reindex" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/content-type/list.js" "run" "{}")"
  echo "$out" | grep -q 'author' || { echo "ERROR: content-type/list missing author" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/layout/list.js" "run" "{}")"
  echo "$out" | grep -q 'banner' || { echo "ERROR: layout/list missing banner" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/mixin/list.js" "run" "{}")"
  echo "$out" | grep -q 'seo' || { echo "ERROR: mixin/list missing seo" >&2; exit 1; }

  out="$(run_node_task "$fixture" "tasks/form-fragment/list.js" "run" "{}")"
  echo "$out" | grep -q 'address' || { echo "ERROR: form-fragment/list missing address" >&2; exit 1; }

  echo "PASS: XP8 component lists"
}

# add → validate → tidy → prune. Guards the data-loss-critical prune path:
# an unused phrase must be removed, a phrase referenced from YAML must be kept.
assert_phrase_roundtrip() {
  local fixture="$1"
  local phrases="$fixture/code/src/main/resources/cms/i18n/phrases.properties"

  echo ""
  echo "=== Smoke test: XP8 phrase round-trip ==="

  run_node_task "$fixture" "tasks/phrase/add.js" "run" \
    "{ key: 'part.extra.displayName', phrase: { en: 'Extra', no: 'Ekstra' } }"
  if ! grep -q 'part.extra.displayName' "$phrases"; then
    echo "ERROR: phrase add did not write part.extra.displayName" >&2
    exit 1
  fi

  node -e "
    process.chdir('${fixture}');
    const task = require('${ROOT_DIR}/tasks/phrase/validate.js');
    const r = task.analyze({ verbose: false, args: {} });
    if (r.numMissing > 0) { console.error('ERROR: validate found ' + r.numMissing + ' inconsistencies'); process.exit(1); }
  "

  run_node_task "$fixture" "tasks/phrase/tidy.js" "run" "{ verbose: false, args: {} }"
  if ! grep -q 'part.extra.displayName' "$phrases"; then
    echo "ERROR: tidy dropped part.extra.displayName" >&2
    exit 1
  fi

  run_node_task "$fixture" "tasks/phrase/prune.js" "run" "{ verbose: false, args: {} }"
  if grep -q 'part.extra.displayName' "$phrases"; then
    echo "ERROR: prune did not remove the unused part.extra.displayName" >&2
    exit 1
  fi
  if ! grep -q 'part.hello.displayName' "$phrases"; then
    echo "ERROR: prune wrongly removed the used part.hello.displayName" >&2
    exit 1
  fi
  echo "PASS: XP8 phrase round-trip"
}

FIXTURE_DIR="$WORK_DIR/xp8-minimal"

scaffold_fixture "$FIXTURE_DIR"

assert_part_create "$FIXTURE_DIR"
assert_part_list "$FIXTURE_DIR"
assert_component_create "$FIXTURE_DIR"
assert_more_creates "$FIXTURE_DIR"
assert_jsx_yaml_build "$FIXTURE_DIR"
assert_component_lists "$FIXTURE_DIR"
run_readonly_tasks "$FIXTURE_DIR"
assert_yaml_i18n_used "$FIXTURE_DIR"
assert_phrase_roundtrip "$FIXTURE_DIR"

echo ""
echo "All smoke tests passed."
