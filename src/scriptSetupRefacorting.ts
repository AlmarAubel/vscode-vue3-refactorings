import * as vscode from "vscode";
import { CallExpression, KindToNodeMappings, Project, ts } from "ts-morph";
import { PropertyAssignment } from "@ts-morph/common/lib/typescript";
export class ScriptSetupRefactoring implements vscode.CodeActionProvider {
  private createFix(
    document: vscode.TextDocument,
    range: vscode.Range,
    emoji: string
  ): vscode.CodeAction {
    console.log("flap");
    const fix = new vscode.CodeAction(
      `Refactor to Script setup`,
      vscode.CodeActionKind.RefactorRewrite
    );
    fix.edit = new vscode.WorkspaceEdit();
    const text = document.getText(range);
    const project = new Project({});

    const sourcefile = project.createSourceFile("temp.ts", text);

    const defaultExport = sourcefile.getDefaultExportSymbolOrThrow();
    const exportedDeclarations = defaultExport.getDeclarations();
    if (!exportedDeclarations) {
      return fix;
    }

    const callExpression =
      exportedDeclarations[0].getFirstDescendantByKindOrThrow(
        ts.SyntaxKind.CallExpression
      );

    const setupMethod = this.getChildOfType(
      callExpression,
      ts.SyntaxKind.MethodDeclaration
    );

    const emitAndProps = this.getChildOfType(
      callExpression,
      ts.SyntaxKind.PropertyAssignment
    );

    var definePropsStatement = "";
    var defineEmitsStatement = "";

    emitAndProps?.forEach((x) => {
      if (x.getName() === "props") {
        var dingen = x.getInitializer();

        definePropsStatement = `const props = defineProps(${dingen?.getText()});`;
      } else if (x.getName() === "emits") {
        var dingen = x.getInitializer();
        defineEmitsStatement = `const emit = defineEmits(${dingen?.getText()});`;
      }
    });
    const setupBody = setupMethod![0]
      .getBodyOrThrow()
      .getChildSyntaxListOrThrow();

    setupBody
      .getChildrenOfKind(ts.SyntaxKind.ReturnStatement)
      .forEach((x) => x.remove());

    const setupStatement = setupBody?.getText() ?? "";
    sourcefile.removeDefaultExport();

    sourcefile.addStatements(definePropsStatement);
    sourcefile.addStatements(defineEmitsStatement);
    sourcefile.addStatements(setupStatement);
    sourcefile.formatText();
    fix.edit.replace(document.uri, range, sourcefile.getText());

    this.AddSetupToScript(range, document, fix);

    return fix;
  }

  private AddSetupToScript(
    range: vscode.Range,
    document: vscode.TextDocument,
    fix: vscode.CodeAction
  ) {
    const scriptTagRange = new vscode.Range(
      range.start.line - 1,
      0,
      range.start.line - 1,
      999
    );

    const scriptTag = document.getText(scriptTagRange);
    const scriptTagWithSetup = scriptTag.replace("script", "script setup");
    fix?.edit?.replace(document.uri, scriptTagRange, scriptTagWithSetup);
  }

  private getChildOfType<TKind extends ts.SyntaxKind>(
    callExpression: CallExpression<ts.CallExpression>,
    syntaxKind: TKind
  ): KindToNodeMappings[TKind][] {
    return callExpression
      .getArguments()[0]
      .getChildSyntaxListOrThrow()
      .getChildrenOfKind(syntaxKind);
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter(
        (diagnostic) =>
          diagnostic.code === "vuer-can-be-converted-to-script-setup"
      )
      .map((diagnostic) => this.createFix(document, diagnostic.range, "text"));
  }
}
