import * as vscode from "vscode";
import { ScriptSetupRefactoring } from "./refactorings/toScriptSetup/toScriptSetupAction";
import toScriptSetup from "./refactorings/toScriptSetup/toScriptSetupDiagnostic";
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
  const diagnostics = new Array<vscode.Diagnostic>();
  const refactorings = [toScriptSetup];

  refactorings.forEach((r) => {
    const diagnostic = r(doc);
    diagnostic && diagnostics.push(diagnostic);
  });

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
