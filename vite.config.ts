import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      "sync-grammar": "scripts/sync-grammar.ts",
      extension: "src/extension.ts",
      server: "src/server.ts",
    },
    deps: {
      alwaysBundle: [
        "@yyds-lang/language-service",
        "vscode-languageserver/node.js",
        "vscode-languageclient",
        "vscode-languageserver",
        "vscode-languageserver-textdocument",
      ],
      neverBundle: ["vscode"],
      onlyBundle: false,
    },
  },
});
