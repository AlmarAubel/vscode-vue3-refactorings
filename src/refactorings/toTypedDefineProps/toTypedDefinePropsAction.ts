import * as vscode from "vscode";

export class TypedDefinePropsAction implements vscode.CodeActionProvider {
  private createFix(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      `Add typings to defineProps`,
      vscode.CodeActionKind.RefactorRewrite
    );
    const notFixable = new vscode.CodeAction(
      "Not fixable",
      vscode.CodeActionKind.Empty
    );

    fix.edit = new vscode.WorkspaceEdit();
    const text = document.getText(range);    
    //fix.edit.replace(document.uri, range, sourcefile.getText());

    return fix;
  }

  // private getChildOfType<
  //   TKind extends
  //     | ts.SyntaxKind.MethodDeclaration
  //     | ts.SyntaxKind.PropertyAssignment
  // >(
  //   callExpression: CallExpression<ts.CallExpression>,
  //   syntaxKind: TKind,
  //   name: string
  // ): KindToNodeMappings[TKind] | undefined {
  //   return callExpression
  //     .getArguments()[0]
  //     .getChildSyntaxListOrThrow()
  //     .getChildrenOfKind(syntaxKind)
  //     .find((x) => x.getName() === name);
  // }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter(
        (diagnostic) => diagnostic.code === "vuer-add-typings-to-defineprops"
      )
      .map((diagnostic) => this.createFix(document, diagnostic.range));
  }
}

interface Setup {
  body: string;
  propName?: string;
  usesEmits: boolean;
}
