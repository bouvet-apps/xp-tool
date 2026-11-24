import assert from "node:assert/strict";
import test from "node:test";
import propertiesReader from "properties-reader";
import { updatePhraseContents } from "../tasks/phrase/edit.js";

test("updates one value while preserving comments and unrelated text", () => {
  const original = "# translator note\r\n\r\nhello = Old\r\nother.key = Keep\r\n";

  assert.equal(
    updatePhraseContents(original, "hello", "New"),
    "# translator note\r\n\r\nhello = New\r\nother.key = Keep\r\n"
  );
});

test("updates the effective value in sectioned properties", () => {
  const original = "# section note\n[group]\nkey = old\n[group]\nkey = effective\n";
  const updated = updatePhraseContents(original, "group.key", "new");

  assert.equal(updated, "# section note\n[group]\nkey = old\n[group]\nkey = new\n");
  assert.equal(propertiesReader().read(updated).getRaw("group.key"), "new");
});

test("adds a missing key outside a section and preserves a BOM", () => {
  const original = "\uFEFF[group]\r\nkey=value\r\n";
  const updated = updatePhraseContents(original, "new.key", "translation");

  assert.equal(updated, "\uFEFFnew.key = translation\r\n[group]\r\nkey=value\r\n");
  assert.equal(propertiesReader().read(updated).getRaw("new.key"), "translation");
});
