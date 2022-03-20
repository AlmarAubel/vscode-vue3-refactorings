import * as vscode from "vscode";
import { Diagnostic } from "../types";
const toScriptSetup = (doc: vscode.TextDocument): Diagnostic => {
  const text = doc.getText();

  const textArr: string[] = text.split(/\r\n|\n/);
  const regex = /<script[\s\S]*?lang="ts">/gm;
  const indexOfScriptOpening = textArr.findIndex((value: string) =>
    regex.test(value)
  );
  const indexOfScriptClosing = textArr.findIndex((value: string) =>
    new RegExp(`<\/script>`).test(value)
  );

  if (
    indexOfScriptOpening !== -1 &&
    indexOfScriptClosing !== -1 &&
    !textArr[indexOfScriptOpening].includes("setup")
  ) {
    const start = 0;
    const end = textArr[indexOfScriptClosing].length;
    const diagnostic = {
      severity: vscode.DiagnosticSeverity.Warning,
      message: `Script can be converted to Script setup`,
      code: "vuer-can-be-converted-to-script-setup",
      source: "Vue3 refactorings",
      range: new vscode.Range(
        indexOfScriptOpening + 1,
        start,
        indexOfScriptClosing - 1,
        end
      ),
    };
    return diagnostic;
  }
  return null;
};

export default toScriptSetup;
