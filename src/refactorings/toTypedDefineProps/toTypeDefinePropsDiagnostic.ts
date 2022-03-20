import * as vscode from "vscode";
import { Diagnostic } from "../types";
export const toTypeDefinePropsDiagnostic = (
  doc: vscode.TextDocument
): Diagnostic => {
  const text = doc.getText();

  const textArr: string[] = text.split(/\r\n|\n/);
  const regex = /defineProps\s*?\([^\)]*\) *(\{?|[^;])/gm;
  const x = doc.getWordRangeAtPosition(new vscode.Position(0, 0), regex);
  let matches = [...text.matchAll(regex)];
  if (!matches || matches.length !== 1) return null;
  const match = matches[0];

  let startPos = doc.positionAt(match.index!);
  let endPos = doc.positionAt(match.index! + match[0].length);
  const range = new vscode.Range(startPos, endPos);

  const diagnostic = {
    severity: vscode.DiagnosticSeverity.Warning,
    message: `DefineProps should be converted to typed version`,
    code: "vuer-can-be-converted-to-typed-defineProps",
    source: "Vue3 refactorings",
    range: range,
  };
  return diagnostic;
};
