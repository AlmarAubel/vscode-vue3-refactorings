import * as vscode from "vscode";
import { ScriptSetupRefactoring } from "./scriptSetupRefacorting";

// The things we care about in a package.json
interface PackageJson {
  name: string;
  types?: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

async function getDiagnostics(
  doc: vscode.TextDocument
): Promise<vscode.Diagnostic[]> {
  const text = doc.getText();
  const diagnostics = new Array<vscode.Diagnostic>();

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
    diagnostics.push({
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
    });
  }

  return diagnostics;
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection =
    vscode.languages.createDiagnosticCollection("vue-refactorings");

  const handler = async (doc: vscode.TextDocument) => {
    if (!doc.fileName.endsWith(".vue")) {
      return;
    }

    const diagnostics = await getDiagnostics(doc);
    diagnosticCollection.set(doc.uri, diagnostics);
  };

  const didOpen = vscode.workspace.onDidOpenTextDocument((doc) => handler(doc));
  const didChange = vscode.workspace.onDidChangeTextDocument((e) =>
    handler(e.document)
  );
  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    "vue",
    new ScriptSetupRefactoring()
  );

  // If we have an activeTextEditor when we open the workspace, trigger the handler
  if (vscode.window.activeTextEditor) {
    await handler(vscode.window.activeTextEditor.document);
  }

  // Push all of the disposables that should be cleaned up when the extension is disabled
  context.subscriptions.push(
    diagnosticCollection,
    didOpen,
    didChange,
    codeActionProvider
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
