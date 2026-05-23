import {
  createConnection,
  type DefinitionParams,
  type HoverParams,
  type InitializeParams,
  type InitializeResult,
  ProposedFeatures,
  type PrepareRenameParams,
  type RenameParams,
  TextDocumentSyncKind,
  TextDocuments,
} from "vscode-languageserver/node.js";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  analyzeDocument,
  getDefinition,
  getHover,
  getRenameEdits,
} from "@yyds-lang/language-service";
import type { TextPosition } from "@yyds-lang/language-service/types";

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

function toOneBasedPosition(line: number, character: number): TextPosition {
  return { line: line + 1, column: character + 1 };
}

function toLspRange(range: {
  start: { line: number; column: number };
  end: { line: number; column: number };
}) {
  return {
    start: {
      line: range.start.line - 1,
      character: range.start.column - 1,
    },
    end: {
      line: range.end.line - 1,
      character: range.end.column - 1,
    },
  };
}

function findRangeAtPosition(
  text: string,
  line: number,
  character: number,
): { start: { line: number; column: number }; end: { line: number; column: number } } | undefined {
  const analysis = analyzeDocument(text);
  const target = toOneBasedPosition(line, character);
  for (const item of [...analysis.references, ...analysis.definitions]) {
    if (
      target.line >= item.range.start.line &&
      target.line <= item.range.end.line &&
      (target.line !== item.range.start.line || target.column >= item.range.start.column) &&
      (target.line !== item.range.end.line || target.column <= item.range.end.column)
    ) {
      return item.range;
    }
  }
  return undefined;
}

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      hoverProvider: true,
      definitionProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
    },
  };
});

connection.onHover((params: HoverParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  const analysis = analyzeDocument(document.getText());
  const position = toOneBasedPosition(params.position.line, params.position.character);
  const hover = getHover(analysis, position);
  if (!hover) {
    return null;
  }
  const content = hover.value ? `**${hover.title}**\n\n${hover.value}` : `**${hover.title}**`;
  return {
    contents: {
      kind: "markdown",
      value: content,
    },
    range: toLspRange(hover.range),
  };
});

connection.onDefinition((params: DefinitionParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  const originRange = findRangeAtPosition(
    document.getText(),
    params.position.line,
    params.position.character,
  );
  if (!originRange) {
    return null;
  }
  const analysis = analyzeDocument(document.getText());
  const position = toOneBasedPosition(params.position.line, params.position.character);
  const definition = getDefinition(analysis, position);
  if (!definition) {
    return null;
  }
  const targetRange = toLspRange(definition.range);
  return [
    {
      targetUri: document.uri,
      targetRange,
      targetSelectionRange: targetRange,
      originSelectionRange: toLspRange(originRange),
    },
  ];
});

connection.onPrepareRename((params: PrepareRenameParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  const activeRange = findRangeAtPosition(
    document.getText(),
    params.position.line,
    params.position.character,
  );
  if (!activeRange) {
    return null;
  }
  return toLspRange(activeRange);
});

connection.onRenameRequest((params: RenameParams) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  const analysis = analyzeDocument(document.getText());
  const position = toOneBasedPosition(params.position.line, params.position.character);
  const edits = getRenameEdits(analysis, position, params.newName);
  if (edits.length === 0) {
    return null;
  }
  return {
    changes: {
      [document.uri]: edits.map((item) => ({
        range: toLspRange(item.range),
        newText: item.newName,
      })),
    },
  };
});

documents.listen(connection);
connection.listen();
