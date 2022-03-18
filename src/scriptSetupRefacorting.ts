import * as vscode from "vscode";
import {
  CallExpression,
  KindToNodeMappings,
  Project,
  SourceFile,
  ts,
} from "ts-morph";
export class ScriptSetupRefactoring implements vscode.CodeActionProvider {
  private createFix(
    document: vscode.TextDocument,
    range: vscode.Range,
    emoji: string
  ): vscode.CodeAction {
    const fix = new vscode.CodeAction(
      `Refactor to Script setup`,
      vscode.CodeActionKind.RefactorRewrite
    );
    const notFixable = new vscode.CodeAction(
      "Not fixable",
      vscode.CodeActionKind.Empty
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

    const defineComponentExpression =
      exportedDeclarations[0].getFirstDescendantByKindOrThrow(
        ts.SyntaxKind.CallExpression
      );

    if (
      defineComponentExpression.getExpression().getText() !== "defineComponent"
    ) {
      return notFixable;
    }

    defineComponentExpression.getExpression();

    this.replaceDefineComponent(defineComponentExpression, sourcefile);

    sourcefile.formatText();
    fix.edit.replace(document.uri, range, sourcefile.getText());

    this.addSetupToScript(range, document, fix);

    return fix;
  }

  private replaceDefineComponent(
    callExpression: CallExpression<ts.CallExpression>,
    sourcefile: SourceFile
  ) {
    const setupStatement = this.getSetupBodyText(callExpression);
    const definePropsStatement = this.getPropsStatement(callExpression);
    const defineEmitsStatement = this.getEmitStatement(callExpression);

    //Todo Check of setup gebruik maakt van Props en emit
    //Todo remove import definecomponent
    sourcefile.removeDefaultExport();

    definePropsStatement && sourcefile.addStatements(definePropsStatement);
    defineEmitsStatement && sourcefile.addStatements(defineEmitsStatement);
    setupStatement && sourcefile.addStatements(setupStatement);
  }

  private getPropsStatement(callExpression: CallExpression<ts.CallExpression>) {
    const propsStatement = this.getChildOfType(
      callExpression,
      ts.SyntaxKind.PropertyAssignment,
      "props"
    );
    if (propsStatement === undefined) {
      return undefined;
    }
    return `const props = defineProps(${propsStatement!
      .getInitializer()!
      .getText()});`;
  }
  private getEmitStatement(callExpression: CallExpression<ts.CallExpression>) {
    const emitsStatement = this.getChildOfType(
      callExpression,
      ts.SyntaxKind.PropertyAssignment,
      "emit"
    );
    if (emitsStatement === undefined) {
      return undefined;
    }
    return `const emit = defineEmits(${emitsStatement!
      .getInitializer()!
      .getText()});`;
  }

  private getSetupBodyText(callExpression: CallExpression<ts.CallExpression>) {
    const setupMethod = this.getChildOfType(
      callExpression,
      ts.SyntaxKind.MethodDeclaration,
      "setup"
    );

    if (setupMethod === undefined) {
      return undefined;
    }

    var setupBody = setupMethod.getBodyOrThrow().getChildSyntaxListOrThrow();
    setupBody
      .getChildrenOfKind(ts.SyntaxKind.ReturnStatement)
      .forEach((x) => x.remove());

    return setupBody.getText() ?? undefined;
  }

  private addSetupToScript(
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

  private getChildOfType<
    TKind extends
      | ts.SyntaxKind.MethodDeclaration
      | ts.SyntaxKind.PropertyAssignment
  >(
    callExpression: CallExpression<ts.CallExpression>,
    syntaxKind: TKind,
    name: string
  ): KindToNodeMappings[TKind] | undefined {
    return callExpression
      .getArguments()[0]
      .getChildSyntaxListOrThrow()
      .getChildrenOfKind(syntaxKind)
      .find((x) => x.getName() === name);
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
