import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const grammarPath = resolve(root, "syntaxes", "yyds.tmLanguage.json");
const configPath = resolve(root, "language-configuration.json");
const fixturePath = resolve(root, "tests/fixtures/basic-song.yyds");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

test("grammar scope and keywords are synced", () => {
  const grammar = readJson(grammarPath);
  assert.equal(grammar.scopeName, "source.yyds");
  const keywordPattern = grammar.repository?.keywords?.patterns?.[0]?.match ?? "";
  assert.match(keywordPattern, /tempo/);
  assert.match(keywordPattern, /section/);
  assert.doesNotMatch(keywordPattern, /\bif\|while\|for\|return\b/);
});

test("language configuration line comment is double slash", () => {
  const config = readJson(configPath);
  assert.equal(config.comments?.lineComment, "//");
  assert.ok(Array.isArray(config.brackets));
});

test("fixture contains tokens covered by grammar", () => {
  const fixture = readFileSync(fixturePath, "utf8");
  assert.match(fixture, /\btempo\b/);
  assert.match(fixture, /\bsection\b/);
  assert.match(fixture, /\b[C-GA-B](?:#|b)?\d\b/);
  assert.match(fixture, /\/\s*q/);
});
