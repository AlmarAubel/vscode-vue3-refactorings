import * as vscode from 'vscode';
import {
  ts,
  Project,
  Identifier,
  ObjectLiteralExpression,
  PropertyAssignment,
  ForEachDescendantTraversalControl,
  CallExpression,
  Node,
  ObjectLiteralElementLike,
  StructureKind,
  InterfaceDeclaration
} from 'ts-morph';
import { vueTypeToTsStype } from '../helpers';

export class TypedDefinePropsAction implements vscode.CodeActionProvider {
  private createFix(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction {
    const fix = new vscode.CodeAction(`Add typings to defineProps`, vscode.CodeActionKind.RefactorRewrite);
    try {
      const notFixable = new vscode.CodeAction('Not fixable', vscode.CodeActionKind.Empty);

      fix.edit = new vscode.WorkspaceEdit();
      const text = document.getText(range);
      console.log('333text', text);
      const updatedSourcefile = this.visitNodes(text);
      console.log('222text', updatedSourcefile.getText());
      fix.edit.replace(document.uri, range, updatedSourcefile.getText());
    } catch (e) {
      console.log('er ging iets mis', e.message);
    }
    return fix;
  }

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter(diagnostic => diagnostic.code === 'vuer-add-typings-to-defineprops')
      .map(diagnostic => this.createFix(document, diagnostic.range));
  }

  //TODO dit moet naar extension.ts toe;
  public visitNodes(text: string) {
    const project = new Project({});
    const sourcefile = project.createSourceFile('temp.ts', text);
    const visitors: Visitor[] = [getVisitor(updateCode)];
    const result = sourcefile.forEachDescendant((node, traversal) => {
      const kind = syntaxKindToString(node.getKind());

      visitors
        // @ts-ignore
        .filter(v => v[kind]?.name === kind)
        .forEach(v => {
          // @ts-ignore
          v[kind](node);
        });
    });
    return sourcefile;
  }
}
function updateCode(path: CallExpression, convertedNode: Node) {
  const propDefinitions = Array<PropDefinition>();
  path
    .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
    .getProperties()
    .forEach(no => {
      try {
        console.log('found match222');
        if (hasObjectLiteralExpression(no)) {
          const prop = getPropDefinitionFromObjectLiteral(no);
          propDefinitions.push(prop);
        } else {
          const structure = no.getStructure();
          if (structure.kind !== StructureKind.PropertyAssignment) return;

          propDefinitions.push({
            identifier: structure.name,
            type: vueTypeToTsStype(structure.initializer as string),
            required: false
          });
        }
      } catch (e) {
        console.log('Er ging iets mis', e);
      }
    });
  const lf = '\n';
  const propsSyntax = propDefinitions.map(p => `${p.identifier}${p.required ? '' : '?'}:${p.type}`);
  const propDefinitionStatement = `{${propsSyntax.join(';')}}`;

  //todo Add defineDefaultProps when needed.
  path.getArguments().forEach(a => path.removeArgument(a));
  path.addTypeArgument(propDefinitionStatement);
  path.formatText();
  return path.getText();
}

function getPropDefinitionFromObjectLiteral(node: ObjectLiteralElementLike) {
  const identifier = node.getFirstChildOrThrow().getText();

  const properties = node.getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
  const type = getType(properties);

  const required = getPropertyInitializer(properties, 'required') === 'true';
  //TODO uitzoeken wat een write function is
  const defaultValue = getPropertyInitializer(properties, 'default');
  const prop = {
    identifier: identifier,
    type: type,
    required: required,
    defaultValue
  };

  return prop;
}

function getPropertyInitializer(properties: ObjectLiteralExpression, name: string) {
  const structure = properties.getProperty(name)?.getStructure();
  if (!structure || structure.kind !== StructureKind.PropertyAssignment) return undefined;
  return structure?.initializer as string;
}

function getType(node: ObjectLiteralExpression) {
  const type = node.getPropertyOrThrow('type');
  if (hasAsExpression(type)) {
    //Real type is wrapped in PropType so we need get the typereference inside de proptype
    return type
      .getFirstDescendantByKindOrThrow(ts.SyntaxKind.TypeReference)
      ?.getFirstDescendantByKindOrThrow(ts.SyntaxKind.TypeReference)
      ?.getText();
  }
  const structure = type.getStructure();
  if (!structure || structure.kind !== StructureKind.PropertyAssignment) throw Error('Not a prop assignment');
  const vueType = structure.initializer as string;

  return vueTypeToTsStype(vueType);
}

function hasAsExpression(node: ObjectLiteralElementLike) {
  return !!(node.getDescendantsOfKind(ts.SyntaxKind.AsExpression).length > 0);
}

function hasObjectLiteralExpression(node: Node): boolean {
  return !!(node.getChildrenOfKind(ts.SyntaxKind.ObjectLiteralExpression).length > 0);
}

function getVisitor(onMatch: (path: CallExpression, convertedNode: Node) => void): Visitor {
  return {
    CallExpression(node: CallExpression) {
      const functionName = node.getExpression().getText();

      if (functionName === 'defineProps') {
        onMatch(node, node);
      }
    }
  };
}

const syntaxKindToString = createEnumWithMarkerToString<ts.SyntaxKind>(ts.SyntaxKind);

function createEnumWithMarkerToString<T extends number = number>(enumeration: any) {
  const map: Map<number, string> = new Map();
  for (let name in enumeration) {
    const id = enumeration[name];
    if (typeof id === 'number' && !map.has(id)) {
      map.set(id, name);
    }
  }
  return (value: T) => map.get(value) as string; //could be undefined if used the wrong enum member..
}
interface Setup {
  body: string;
  propName?: string;
  usesEmits: boolean;
}

type Visitor = {
  CallExpression?: (node: CallExpression) => void;
  Identifier?: (node: Identifier) => void;
};
interface PropDefinition {
  identifier: string;
  type: string;
  required: boolean;
  defaultValue?: string;
}
