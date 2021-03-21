
import Logger from "../logger.mjs";
import Dummy from "./dummy.mjs";
import visitExpression from "./visit-expression.mjs";
import {visitClosure, visitReturnStatement } from "./visit-closure.mjs";
import visitClass from "./visit-class.mjs";

export default visitStatement = (node, location) => {
  if (node.type in visitors) {
    return visitors[node.type](node, locations);
  }
  logger.error(`Invalid statement node, got: ${node.type}`);
  return Dummy.getExpressionStatement();
};

const empty = {
  node: null,
  entities: []
};

const visitSwitchCase = (node, location) => {
  let pair = empty;
  if (node.test !== null) {
    pair = visitExpression(node.test, location, Context.getVoidContext());
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
  logger.error(`Invalid label node, got: ${node.type}`);
  return {
    node: Dummy.getLabelNode(),
    entities: []
  };
};

const visitBlock = (node, location) => {
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
  return Dummy("Block", node);
};

const visitCatchClause = (node, location) => {
  if (node.type === "CatchClause") {
    let pair1 = empty;
    if (node.param !== null) {
      pair1 = visitPattern(node.param, location);
    }
    const pair2 = visitBlock(node.body, location);
    return {
      node: {
        type: "CatchClause",
        param: pair1.node,
        body: pair2.node
      },
      entities: [...pair1.entities, ...pair2.entities]
    };
  }
  logger.error(`Invalid catch clause node, got: ${node.type}`);
  return {
    node: Dummy.getCatchClause(),
    entities: []
  };
};

const visitVariableDeclarator = (node, location) => {
  if (node.type !== "VariableDeclarator") {
    logger.error(`Invalid variable declarator node, got: ${node.type}`);
    return {
      node: Dummy.getVariableDeclarator(),
      entities: []
    };
  }
  const pair1 = visitPattern(node.id, location);
  let pair2 = empty;
  if (node.init !== null) {
    let context = Context.getVoidContext();
    if (location, node.id.type === "Identifier") {
      context = new Context.VariableContext(node.id, kind)
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
};

const visitLocalIdentifier = (node, location) => {
  if (node.type !== "Identifier") {
    logger.error(`Invalid local identifier, got: ${node.type}`);
    return {
      node: Dummy.getIdentifierNode(),
      entities: []
    };
  }
  location.getNamespace().checkIdentifierCollision(node.name);
  return {
    node: {
      type: "Identifier",
      name: node.name
    },
    entities: []
  };
};

const visitImportSpecifier = (node, location) => {
  if (node.type === "ImportSpecifier") {
    return {
      node: {
        type: "ImportSpecifier",
        local: visitLocalIdentifier(node.local, location),
        imported: visitKey(node.imported, location, false)
      },
      entities: []
    };
  }
  if (node.type === "ImportDefaultSpecifier") {
    return {
      node: {
        type: "ImportDefaultSpecifier",
        local: visitLocalIdentifier(node.local, location)
      },
      entities: []
    };
  }
  if (node.type === "ImportNamespaceSpecifier") {
    return {
      node: {
        type: "ImportNamespaceSpecifier",
        local: visitLocalIdentifier(node.local, location)
      },
      entities: []
    };
  }
  logger.error(`Invalid import specifier node, got: ${node.type}`);
  return {
    node: Dummy.getImportSpecifierNode(),
    entities: []
  };
};

const visitExportSpecifier = (node, location) => {
  if (node.type === "ExportSpecifier") {
    return {
      node: {
        type: "ExportSpecifier",
        local: visitLocalIdentifier(node.local, location),
        exported: visitKey(node.exported, location, false)
      },
      entities: []
    };
  }
  logger.error(`Invalid export specifier node, got: ${node.type}`);
  return {
    node: Dummy.getExportSpecifierNode(),
    entities: []
  };
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
  logger.error(`Invalid source node, got: ${node.type}`);
  return {
    node: Dummy.getSourceNode(),
    entities: []
  };
};

const visitors = {
  // Atomic //
  ThrowStatement: (node, location) => {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
    return {
      node: {
        type: "ThrowStatement",
        argument: pair.node
      },
      entities: pair.entities
    };
  }
  ExpressionStatement: (node, location) => {
    const pair = visitExpression(node.argument, location, Context.getVoidContext());
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
  FunctionDeclaration: (node, location) => {
    let context = Context.getVoidContext();
    if (node.id !== null) {
      context = new Context.VariableContext(node.id)
    }
    return visitClosure(node, location, context);
  },
  ClassDeclaration: (node, location) => {
    let context = Context.getVoidContext();
    if (node.id !== null) {
      context = new Context.VariableContext(node.id)
    }
    return visitClass(node, location, new Context.VariableContext(node.id));
  },
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
      pair = visitExpression(node.declaration, location, Context.getVoidContext());
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
    const pair1 = visitExpression(node.test, location, Context.getVoidContext());
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
    const pair1 = visitExpression(node.test, location, Context.getVoidContext());
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
    const pair1 = visitExpression(node.test, location, Context.getVoidContext());
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
        pair1 = visitExpression(node.init, location, Context.getVoidContext());
      }
    }
    let pair2 = empty;
    if (node.test !== null) {
      pair2 = visitExpression(node.test, location, Context.getVoidContext());
    }
    let pair3 = empty;
    if (node.update !== null) {
      pair3 = visitExpression(node.update, location, Context.getVoidContext());
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
        context = new Context.VariableContext(node.left.declarations.id, "assignment");
      } else {
        context = Context.getVoidContext();
      }
    } else {
      pair1 = visitPattern(node.left, location);
      context = new Context.VariableContext(node.left, "assignment");
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
        context = new Context.VariableContext(node.left.declarations.id, "assignment");
      } else {
        context = Context.getVoidContext();
      }
    } else {
      pair1 = visitPattern(node.left, location);
      context = new Context.VariableContext(node.left, "assignment");
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
    const pair = visitExpression(node.discriminant, location, Context.getVoidContext());
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
