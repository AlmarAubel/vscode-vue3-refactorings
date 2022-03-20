import * as vscode from "vscode";
import toScriptSetup from "./refactorings/toScriptSetup";
import toTypedDefineProps from "./refactorings/toTypedDefineProps";
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
  const refactorings = [
    toScriptSetup.diagnostic,
    toTypedDefineProps.diagnostic,
  ];

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
  const actions = [toScriptSetup.action, toTypedDefineProps.action];

  const codeActionProviders = actions
    .filter((a) => !!a)
    .map((a) => vscode.languages.registerCodeActionsProvider("vue", new a!()));

  // If we have an activeTextEditor when we open the workspace, trigger the handler
  if (vscode.window.activeTextEditor) {
    await handler(vscode.window.activeTextEditor.document);
  }

  // Push all of the disposables that should be cleaned up when the extension is disabled
  context.subscriptions.push(
    diagnosticCollection,
    didOpen,
    didChange,
    ...codeActionProviders
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
