
import dummify from "./dummify.mjs";
import {getVoidContext} from "./context.mjs";
import {visitExpression} from "./visit-expression.mjs";
import {visitFunctionDeclaration, visitReturnStatement } from "./visit-closure.mjs";
import {visitClassDeclaration} from "./visit-class.mjs";

const empty = {
  node: null,
  entities: []
};

export const visitStatement = (node, location) => {
  if (node.type in visitors) {
    return visitors[node.type](node, locations);
  }
  return dummify("Statement", node);
};

const visitSwitchCase = (node, location) => {
  if (node.type === "SwitchCase") {
    let pair = empty;
    if (node.test !== null) {
      pair = visitExpression(node.test, location, getVoidContext());
    }
    const pairs = node.consequent((node) => visitStatement(node, location));
    return {
      node: {
        type: "SwitchCase",
        test: pair1.node,
        consequent: pair1.map(getNode)
      },
      entities: [...pair1.entities, ...pairs.flatMap(getEntities)]
    };
  }
  return dummify("SwitchCase", node);
}

const visitLabel = (node, location) => {
  if (node.type === "Identifier") {
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  }
  return dummify("Label", node);
};

const visitBlockStatement = (node, location) => {
  if (node.type === "BlockStatement") {
    const pairs = node.body.map((node) => visitStatement(node, location));
    return {
      node: {
        type: "BlockStatement",
        body: pairs.map(getNode)        
      },
      entities: pairs.flatMap(getEntities)
    };
  }
  return dummify("BlockStatement", node);
};

const visitCatchClause = (node, location) => {
  if (node.type === "CatchClause") {
    let pair1 = empty;
    if (node.param !== null) {
      pair1 = visitPattern(node.param, location);
    }
    const pair2 = visitBlockStatement(node.body, location);
    return {
      node: {
        type: "CatchClause",
        param: pair1.node,
        body: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  }
  return dummify("CatchClause", node);
};

const visitVariableDeclarator = (node, location) => {
  if (node.type === "VariableDeclarator") {
    const pair1 = visitPattern(node.id, location);
    let pair2 = empty;
    if (node.init !== null) {
      let context = getVoidContext();
      if (location, node.id.type === "Identifier") {
        context = new VariableContext(node.id, kind)
      }
      pair2 = visitExpression(node.init,  location, context);
    }
    return {
      node: {
        type: "VariableDeclarator",
        id: pair1.node,
        init: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  }
  return dummify("VariableDeclarator", node);
};

const visitLocal = (node, location) => {
  if (node.type === "Identifier") {
    location.getNamespace().checkIdentifierCollision(node.name);
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  }
  return dummify("Local", node);
};

const visitImportSpecifier = (node, location) => {
  if (node.type === "ImportSpecifier") {
    return {
      node: {
        type: "ImportSpecifier",
        local: visitLocal(node.local, location),
        imported: visitKey(node.imported, location, false)
      },
      entities: []
    };
  }
  if (node.type === "ImportDefaultSpecifier") {
    return {
      node: {
        type: "ImportDefaultSpecifier",
        local: visitLocal(node.local, location)
      },
      entities: []
    };
  }
  if (node.type === "ImportNamespaceSpecifier") {
    return {
      node: {
        type: "ImportNamespaceSpecifier",
        local: visitLocal(node.local, location)
      },
      entities: []
    };
  }
  return dummify("ImportSpecifier", node);
};

const visitExportSpecifier = (node, location) => {
  if (node.type === "ExportSpecifier") {
    return {
      node: {
        type: "ExportSpecifier",
        local: visitLocal(node.local, location),
        exported: visitKey(node.exported, location, false)
      },
      entities: []
    };
  }
  return dummify("ExportSpecifier", node);
};

const visitSource = (node, location) => {
  if (node.type === "Literal" && typeof node.value === "string" && Reflect.getOwnPropertyDescriptor(node, "regex") === undefined) {
    return {
      node: {
        type: "Literal",
        value: node.value
      },
      entities: []
    };
  }
  return dummify("Source", node);
};

const visitors = {
  // Atomic //
  ThrowStatement: (node, location) => {
    const pair = visitExpression(node.argument, location, getVoidContext());
    return {
      node: {
        type: "ThrowStatement",
        argument: pair.node
      },
      entities: pair.entities
    };
  }
  ExpressionStatement: (node, location) => {
    const pair = visitExpression(node.argument, location, getVoidContext());
    return {
      node: {
        type: "ExpressionStatement",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  DebuggerStatement: (node, location) => ({
    node: {
      type: "DebuggerStatement"
    },
    entities: []
  }),
  BreakStatement: (node, location) => {
    let pair = empty;
    if (node.label !== null) {
      pair = visitLabel(node.label, location);
    }
    return {
      node: {
        type: "BreakStatement",
        label: pair.node
      },
      entities: []
    };
  },
  BreakStatement: (node, location) => {
    let pair = empty;
    if (node.label !== null) {
      pair = visitLabel(node.label, location);
    }
    return {
      node: {
        type: "BreakStatement",
        label: pair.node
      },
      entities: []
    };
  },
  ReturnStatement: visitReturnStatement,
  // Declaration //
  VariableDeclaration: (node, location) => {
    const pairs = visitVariableDeclarator(node, location, node.kind);
    return {
      node: {
        type: "VariableDeclaration",
        kind: node.kind,
        declarations: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  FunctionDeclaration: visitFunctionDeclaration,
  ClassDeclaration: visitClassDeclaration,
  ImportDeclaration: (node, location) => {
    const pairs = node.specifiers.map((node) => visitImportSpecifier(node, location));
    const pair = visitSource(node, location);
    return {
      node: {
        type: "ImportDeclaration",
        specifiers: pairs.map(getNode),
        source: pair.node
      },
      entities: [...pairs.flatMap(getEntities), ...pair.entities]
    };
  },
  ExportNamedDeclaration: (node, location) => {
    let pair1 = empty;
    if (node.declaration !== null) {
      pair1 = visitStatement(node.declaration, location);
    }
    const pairs = node.specifiers.map((node) => visitExportSpecifier(node, location));
    let pair2 = empty;
    if (node.source !== null) {
      pair2 = visitSource(node.source, location);
    }
    return {
      node: {
        type: "ExportNamedDeclaration",
        declaration: pair1.node,
        specifiers: pairs2.map(getNode),
        source: pair1.source
      },
      entities: [...pair1.entities, ...pairs.flatMap(getEntities), ...pair2.entities]
    };
  },
  ExportDefaultDeclaration: (node, location) => {
    let pair;
    if (node.declaration.type === "FunctionDeclaration" || node.declaration.type === "ClassDeclaration") {
      pair = visitStatement(node.declaration, location);
    } else {
      pair = visitExpression(node.declaration, location, getVoidContext());
    }
    return {
      node: {
        type: "ExportDefaultDeclaration",
        declaration: pair.node
      },
      entities: pair.entities
    };
  },
  ExportAllDeclaration: (node, location) => {
    const pair = visitSource(node.source, location);
    return {
      node: {
        type: "ExportAllDeclaration",
        source: pair.node
      },
      entities: pair.entities
    };
  },
  // Compound //
  LabeledStatement: (node, location) => {
    const pair1 = visitLabel(node.label, location);
    const pair2 = visitStatement(node.body, location);
    return {
      node: {
        type: "LabeledStatement",
        label: pair1.node,
        body: pair2.node 
      },
      entities: [...pair1.node, ...pair2.node]
    };
  },
  BlockStatement: (node, location) => {
    const pairs = node.body.map((node) => visitStatement(node, location));
    return {
      node: {
        type: "BlockStatement",
        body: pairs.map(getNode)
      },
      entities: pairs.flatMap(getEntities)
    };
  },
  IfStatement: (node, location) => {
    const pair1 = visitExpression(node.test, location, getVoidContext());
    let pair2 = empty;
    if (node.consequent !== null) {
      pair2 = visitStatement(node.consequent, location);
    }
    let pair3 = empty;
    if (node.alternate !== null) {
      pair3 = visitStatement(node.alternate, location);
    }
    return {
      node: {
        type: "IfStatement",
        test: pair1.node,
        consequent: pair2.node,
        alternate: pair3.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  TryStatement: (node, location) => {
    const pair1 = visitStatement(node.block, location);
    let pair2 = empty;
    if (node.handler !== null) {
      pair2 = visitCatchClause(node.handler, location);
    }
    let pair3 = empty;
    if (node.finalizer !== null) {
      pair3 = visitStatement(node.finalizer, location);
    }
    return {
      node: {
        type: "TryStatement",
        block: pair1.node,
        handler: pair2.node,
        finalizer: pair3.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  WhileStatement: (node, location) => {
    const pair1 = visitExpression(node.test, location, getVoidContext());
    const pair2 = visitStatement(node.body, location);
    return {
      node: {
        type: "WhileStatement",
        test: pair1.node,
        body: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  DoWhileStatement: (node, location) => {
    const pair1 = visitExpression(node.test, location, getVoidContext());
    const pair2 = visitStatement(node.body, location);
    return {
      node: {
        type: "DoWhileStatement",
        test: pair1.node,
        body: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  },
  ForStatement: (node, location) => {
    let pair1 = empty;
    if (node.init !== null) {
      if (node.init.type === "VariableDeclaration") {
        pair1 = visitStatement(node.init, location);
      } else {
        pair1 = visitExpression(node.init, location, getVoidContext());
      }
    }
    let pair2 = empty;
    if (node.test !== null) {
      pair2 = visitExpression(node.test, location, getVoidContext());
    }
    let pair3 = empty;
    if (node.update !== null) {
      pair3 = visitExpression(node.update, location, getVoidContext());
    }
    const pair4 = visitStatement(node.body, location);
    return {
      node: {
        type: "ForStatement",
        init: pair1.node,
        test: pair2.node,
        update: pair3.node,
        body: pair4.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities, ...pair4.entities]
    };
  },
  ForOfStatement: (node, location) => {
    let pair1;
    let context;
    if (node.left.type === "VariableDeclaration") {
      pair1 = visitStatement(node.left, location);
      if (node.left.declarations.length === 1 && node.left.declarations[0].id.type === "Identifier") {
        context = new VariableContext(node.left.declarations.id, "assignment");
      } else {
        context = getVoidContext();
      }
    } else {
      pair1 = visitPattern(node.left, location);
      context = new VariableContext(node.left, "assignment");
    }
    const pair2 = visitExpression(node.right, location, context);
    const pair3 = visitStatement(node.body, location);
    return {
      node: {
        type: "ForOfStatement",
        await: node.type,
        left: pair1.node,
        right: pair2.node,
        body: pair3.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  ForOfStatement: (node, location) => {
    let pair1;
    let context;
    if (node.left.type === "VariableDeclaration") {
      pair1 = visitStatement(node.left, location);
      if (node.left.declarations.length === 1 && node.left.declarations[0].id.type === "Identifier") {
        context = new VariableContext(node.left.declarations.id, "assignment");
      } else {
        context = getVoidContext();
      }
    } else {
      pair1 = visitPattern(node.left, location);
      context = new VariableContext(node.left, "assignment");
    }
    const pair2 = visitExpression(node.right, location, context);
    const pair3 = visitStatement(node.body, location);
    return {
      node: {
        type: "ForInStatement",
        left: pair1.node,
        right: pair2.node,
        body: pair3.node
      },
      entities: [...pair1.entities, ...pair2.entities, ...pair3.entities]
    };
  },
  SwitchStatement: (node, location) => {
    const pair = visitExpression(node.discriminant, location, getVoidContext());
    const pairs = node.cases.map((node) => visitSwitchCase(node, location));
    return {
      node: {
        type: "SwitchStatement",
        discriminant: pair.node,
        cases: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  }
};
