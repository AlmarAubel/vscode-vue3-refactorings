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
  StructureKind
} from 'ts-morph';
import { forEachChild, Type, visitEachChild } from 'typescript';
interface PropDefinition {
  identifier: string;
  type: string;
  required: boolean;
  defaultValue?: object; //Should be type of type
}

export const doeIets = (text: string) => {
  const project = new Project({});
  const sourcefile = project.createSourceFile('temp.ts', text);
  console.log('----------------------**********_____________');
  const visitors: Visitor[] = [];
  //visitors.push(GetVisitor((node) => console.log(node?.getText())));
  visitors.push(getVisitor(updateCode));
  const result = sourcefile.forEachDescendant((node, traversal) => {
    const kind = syntaxKindToString(node.getKind());

    //TODO dit moet naar extension.ts toe;
    visitors
      // @ts-ignore
      .filter(v => v[kind]?.name === kind)
      .forEach(v => {
        // @ts-ignore
        v[kind](node);
      });
  });
};

function updateCode(path: CallExpression, convertedNode: Node) {
  const propDefinitions = Array<PropDefinition>();
  path
    .getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression)
    .getProperties()
    .forEach(no => {
      if (hasObjectLiteralExpression(no)) {
        const prop = getPropDefinitionFromObjectLiteral(no);
        propDefinitions.push(prop);
      } else {
        const structure = no.getStructure();
        if (structure.kind !== StructureKind.PropertyAssignment) return;
        propDefinitions.push({
          identifier: structure.name,
          type: structure.initializer,
          required: false
        });
      }
    });
  propDefinitions.forEach(p => console.dir(p));
}

function getPropDefinitionFromObjectLiteral(node: ObjectLiteralElementLike) {
  const identifier = node.getFirstChildOrThrow().getText();

  const properties = node.getFirstChildByKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
  const type = getType(properties);
  const required = properties.getProperty('required')?.getStructure().initializer === 'true';

  const prop = {
    identifier: identifier,
    type: type,
    required: required
  };

  return prop;
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
  const vueType = type.getStructure().initializer;
  
  return ?? '';
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

type Visitor = {
  CallExpression?: (node: CallExpression) => void;
  Identifier?: (node: Identifier) => void;
};

// function VisitDefinePropsArguments(
//   identifier: Identifier,
//   traversal: ForEachDescendantTraversalControl
// ) {
//   identifier
//     .getSymbol()
//     ?.getDeclarations()
//     .forEach((x) =>
//       x.forEachDescendant((no, trav) => { }

// }
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
