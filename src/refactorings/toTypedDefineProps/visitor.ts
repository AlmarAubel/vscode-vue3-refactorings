import * as vscode from "vscode";
import {
  DirectoryEmitResult,
  ts,
  Project,
  Identifier,
  ObjectLiteralExpression,
  ForEachDescendantTraversalControl,
  CallExpression,
  Node,
} from "ts-morph";
import { forEachChild } from "typescript";

export const doeIets = (text: string, range: vscode.Range) => {
  const project = new Project({});
  const sourcefile = project.createSourceFile("temp.ts", text);
  console.log("----------------------**********_____________");
  const visitors: Visitor[] = [];
  visitors.push(GetVisitor(range, (node) => console.log(node?.getText())));

  const result = sourcefile.forEachDescendant((node, traversal) => {
    const kind = syntaxKindToString(node.getKind());

    //TODO dit moet naar extension.ts toe;
    visitors
      // @ts-ignore
      .filter((v) => v[kind]?.name === kind)
      .forEach((v) => {
        // @ts-ignore
        v[kind](node);
      });
  });
};
function GetVisitor(
  range: vscode.Range,
  onMatch: (path: Node, convertedNode: Node) => void
): Visitor {
  return {
    CallExpression(node: CallExpression) {
      const functionName = node.getExpression().getText();
      if (functionName === "defineProps") {
        onMatch(node, node);
      }
    },
    Identifier(node: Identifier) {
      onMatch(node, node);
    },
  };
}
const syntaxKindToString = createEnumWithMarkerToString<ts.SyntaxKind>(
  ts.SyntaxKind
);

type Visitor = {
  CallExpression(node: CallExpression): void;
  Identifier(node: Identifier): void;
};
function VisitDefinePropsArguments(
  identifier: Identifier,
  traversal: ForEachDescendantTraversalControl
) {
  identifier
    .getSymbol()
    ?.getDeclarations()
    .forEach((x) =>
      x.forEachDescendant((no, trav) => {
        switch (no.getKind()) {
          case ts.SyntaxKind.PropertyAssignment:
          case ts.SyntaxKind.Identifier:
            console.log(
              "222eyyy",
              syntaxKindToString(no.getKind()),
              no.getText()
            );
            traversal.up();
            break;
          case ts.SyntaxKind.MethodSignature:
            trav.up();
            break;
          default:
            console.log(
              "33333",
              syntaxKindToString(no.getKind()),
              no.getText()
            );
        }
      })
    );
}
function createEnumWithMarkerToString<T extends number = number>(
  enumeration: any
) {
  const map: Map<number, string> = new Map();
  for (let name in enumeration) {
    const id = enumeration[name];
    if (typeof id === "number" && !map.has(id)) {
      map.set(id, name);
    }
  }
  return (value: T) => map.get(value) as string; //could be undefined if used the wrong enum member..
}
