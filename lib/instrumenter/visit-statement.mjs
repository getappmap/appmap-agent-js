
import makeVisit from  "./make-visit.mjs";
import {visitKey} from "./visit-key.mjs";
import {visitPattern} from "./visit-pattern.mjs";
import {visitExpression} from "./visit-expression.mjs";
import {getFunctionDeclarationVisitor, getReturnStatementVisitor } from "./visit-closure.mjs";
import {getClassDeclarationVisitor} from "./visit-class.mjs";

const getEntities = ({entities}) => entities;
const getNode = ({node}) => node;
const empty = {
  node: null,
  entities: []
};

const visitSwitchCase = makeVisit("SwitchCase", {
  __proto__: null,
  SwitchCase: (node, location) => {
    let pair = empty;
    if (node.test !== null) {
      pair = visitExpression(node.test, location);
    }
    const pairs = node.consequent((child) => visitStatement(child, location));
    return {
      node: {
        type: "SwitchCase",
        test: pair.node,
        consequent: pair.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  }
});

const visitLabel = makeVisit("Label", {
  __proto__: null,
  Identifier: (node, location) => ({
    node: {
      type: "Identifier",
      name: node.name
    },
    entities: []
  })
});

const blockStatementVisitor = (node, location) => {
  const pairs = node.body.map((child) => visitStatement(child, location));
  return {
    node: {
      type: "BlockStatement",
      body: pairs.map(getNode)        
    },
    entities: pairs.flatMap(getEntities)
  };
};

export const visitBlockStatement = makeVisit("BlockStatement", {
  __proto__: null,
  BlockStatement: blockStatementVisitor
});

const visitCatchClause = makeVisit("CatchClause", {
  __proto__: null,
  CatchClause: (node, location) => {
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
});

const visitVariableDeclarator = makeVisit("VariableDeclarator", {
  __proto__: null,
  VariableDeclarator: (node, location) => {
    const pair1 = visitPattern(node.id, location);
    let pair2 = empty;
    if (node.init !== null) {
      pair2 = visitExpression(node.init,  location);
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
});

const visitLocal = makeVisit("Local", {
  __proto__: null,
  Identifier: (node, location) => {
    location.getNamespace().checkIdentifierCollision(node.name);
    return {
      node: {
        type: "Identifier",
        name: node.name
      },
      entities: []
    };
  }
});

const visitImportSpecifier = makeVisit("ImportSpecifier", {
  __proto__: null,
  ImportSpecifier: (node, location) => ({
    node: {
      type: "ImportSpecifier",
      local: visitLocal(node.local, location),
      imported: visitKey(node.imported, location, false)
    },
    entities: []
  }),
  ImportDefaultSpecifier: (node, location) => ({
    node: {
      type: "ImportDefaultSpecifier",
      local: visitLocal(node.local, location)
    },
    entities: []
  }),
  ImportNamespaceSpecifier: (node, location) => ({
    node: {
      type: "ImportNamespaceSpecifier",
      local: visitLocal(node.local, location)
    },
    entities: []
  })
});

const visitExportSpecifier = makeVisit("ExportSpecifier", {
  __proto__: null,
  ExportSpecifier: (node, location) => ({
    node: {
      type: "ExportSpecifier",
      local: visitLocal(node.local, location),
      exported: visitKey(node.exported, location, false)
    },
    entities: []
  })
});

const visitSource = makeVisit("Source", {
  __proto__: null,
  Literal: (node, location) => {
    if (typeof node.value === "string" && Reflect.getOwnPropertyDescriptor(node, "regex") === undefined) {
      return {
        node: {
          type: "Literal",
          value: node.value
        },
        entities: []
      };
    }
    throw new Error(`Invalid source literal node`);
  }
});

export const visitStatement = makeVisit("Statement", {
  __proto__: null,
  // Atomic //
  ThrowStatement: (node, location) => {
    const pair = visitExpression(node.argument, location);
    return {
      node: {
        type: "ThrowStatement",
        argument: pair.node
      },
      entities: pair.entities
    };
  },
  ExpressionStatement: (node, location) => {
    const pair = visitExpression(node.argument, location);
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
  ContinueStatement: (node, location) => {
    let pair = empty;
    if (node.label !== null) {
      pair = visitLabel(node.label, location);
    }
    return {
      node: {
        type: "ContinueStatement",
        label: pair.node
      },
      entities: []
    };
  },
  ReturnStatement: getReturnStatementVisitor(),
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
  FunctionDeclaration: getFunctionDeclarationVisitor(),
  ClassDeclaration: getClassDeclarationVisitor(),
  ImportDeclaration: (node, location) => {
    const pairs = node.specifiers.map((child) => visitImportSpecifier(child, location));
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
    const pairs = node.specifiers.map((child) => visitExportSpecifier(child, location));
    let pair2 = empty;
    if (node.source !== null) {
      pair2 = visitSource(node.source, location);
    }
    return {
      node: {
        type: "ExportNamedDeclaration",
        declaration: pair1.node,
        specifiers: pairs.map(getNode),
        source: pair2.node
      },
      entities: [...pair1.entities, ...pairs.flatMap(getEntities), ...pair2.entities]
    };
  },
  ExportDefaultDeclaration: (node, location) => {
    let pair;
    if (node.declaration.type === "FunctionDeclaration" || node.declaration.type === "ClassDeclaration") {
      pair = visitStatement(node.declaration, location);
    } else {
      pair = visitExpression(node.declaration, location);
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
  BlockStatement: blockStatementVisitor,
  IfStatement: (node, location) => {
    const pair1 = visitExpression(node.test, location);
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
    const pair1 = visitBlockStatement(node.block, location);
    let pair2 = empty;
    if (node.handler !== null) {
      pair2 = visitCatchClause(node.handler, location);
    }
    let pair3 = empty;
    if (node.finalizer !== null) {
      pair3 = visitBlockStatement(node.finalizer, location);
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
    const pair1 = visitExpression(node.test, location);
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
    const pair1 = visitExpression(node.test, location);
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
        pair1 = visitExpression(node.init, location);
      }
    }
    let pair2 = empty;
    if (node.test !== null) {
      pair2 = visitExpression(node.test, location);
    }
    let pair3 = empty;
    if (node.update !== null) {
      pair3 = visitExpression(node.update, location);
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
    if (node.left.type === "VariableDeclaration") {
      pair1 = visitStatement(node.left, location);
    } else {
      pair1 = visitPattern(node.left, location);
    }
    const pair2 = visitExpression(node.right, location);
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
  ForInStatement: (node, location) => {
    let pair1;
    if (node.left.type === "VariableDeclaration") {
      pair1 = visitStatement(node.left, location);
    } else {
      pair1 = visitPattern(node.left, location);
    }
    const pair2 = visitExpression(node.right, location);
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
    const pair = visitExpression(node.discriminant, location);
    const pairs = node.cases.map((child) => visitSwitchCase(child, location));
    return {
      node: {
        type: "SwitchStatement",
        discriminant: pair.node,
        cases: pairs.map(getNode)
      },
      entities: [...pair.entities, ...pairs.flatMap(getEntities)]
    };
  }
});
