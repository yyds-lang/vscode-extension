import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { yydsGrammar, yydsLanguageConfiguration } from "@yyds-lang/textmate";
import textmatePackage from "@yyds-lang/textmate/package.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const grammarPath = resolve(root, "syntaxes", "yyds.tmLanguage.json");
const configPath = resolve(root, "language-configuration.json");
const checkOnly = process.argv.includes("--check");
const textmateVersion = textmatePackage.version;

function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function ensureParent(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function syncFile(path: string, payload: unknown): void {
  const next = stableJson(payload);
  let current: string | null = null;
  try {
    current = readFileSync(path, "utf8");
  } catch {
    current = null;
  }

  if (checkOnly) {
    if (current !== next) {
      throw new Error(`Grammar assets out of date: ${path}`);
    }
    return;
  }

  if (current !== next) {
    ensureParent(path);
    writeFileSync(path, next, "utf8");
  }
}

if (yydsGrammar?.scopeName !== "source.yyds") {
  throw new Error(`Unexpected grammar scopeName from @yyds-lang/textmate@${textmateVersion}`);
}

syncFile(grammarPath, yydsGrammar);
syncFile(configPath, yydsLanguageConfiguration);

if (!checkOnly) {
  console.log(`Synced grammar assets from @yyds-lang/textmate@${textmateVersion}`);
}
