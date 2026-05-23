# YYDS Language

YYDS language support for VS Code and compatible editors (including code-server).

## Features

- Syntax highlighting for `.yyds` files
- TextMate grammar scope: `source.yyds`
- Language configuration for comments and brackets
- Grammar assets are generated from `@yyds-lang/textmate`

## Development

```bash
npm install
npm run sync:grammar
npm test
```

Run extension in development host:

- Press `F5` in VS Code
- Open a `.yyds` file (for example: `tests/fixtures/basic-song.yyds`)

## Packaging

```bash
npm run package
```

This command syncs grammar assets and outputs a `.vsix` package.

## Notes

- Do not hand-edit `syntaxes/yyds.tmLanguage.json` or `language-configuration.json`
- Source of truth is `@yyds-lang/textmate`
