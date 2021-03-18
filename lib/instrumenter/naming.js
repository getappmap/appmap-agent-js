
class Naming {
  getName () {
    const kind = this.getKind();
    return `${this.getConnector()}${this.getRawName()}${kind === null ? '' : `|${kind}`}`;
  }
  getConnector () {
    throw new Error(`Should be overriden`);
  }
  getRawName () {
    throw new Error(`Should be overriden`);
  }
  getKind () {
    throw new Error(`Should be overriden`);
  }
  isStatic () {
    return false;
  }
}

////////////////
// VoidNaming //
////////////////

class VoidNaming export Naming {
  getConnector () {
    return "";
  }
  getRawName () {
    return "none";
  }
  getKind () {
    return null;
  }
}

const naming = new VoidNaming();

export const getVoidNaming = () => {
  return naming;
}

////////////////////
// VariableNaming //
////////////////////

export class VariableNaming extends Naming {
  constructor (node, kind) {
    if (node.type !== "Identifier") {
      throw new Error(`Invalid node for variable naming`);
    }
    this.node = node;
    this.kind = kind;
  }
  getConnector () {
    return "@";
  }
  getKind () {
    return this.kind;
  }
  getRawName () {
    return this.node.name;
  }
}

///////////////
// KeyNaming //
///////////////

class KeyNaming extends Naming {
  constructor (node) {
    this.node = node;
  }
  getConnector () {
    return ".";
  }
  getRawName () {
    if (!this.node.computed) {
      return this.node.key.name;
    }
    if (this.node.key.type === "Literal" && typeof this.node.key.value === "string" && !Reflect.getOwnPropertyDescriptor(this.node.key.value)) {
      return JSON.stringify(this.node.key.value);
    }
    return "#dynamic";
  }
}

const mapping = {
  "get": "getter",
  "set": "setter",
  "method": "method",
  "init": "value",
  "constructor": "constructor"
};

export class ObjectKeyNaming extends Naming {
  constructor (node) {
    if (node.type === "Property") {
      throw new Error(`Invalid object key naming node`);
    }
    super(node);
  }
  getKind () {
    return `object-${node.method ? "method" : node.kind}`;
  }
}

export class ClassKeyNaming extends Naming {
  constructor (node) {
    if (node.type !== "MethodDefinition") {
      throw new Error(`Invalid class key naming node`);
    }
    super(node);
  }
  getKind () {
    return `${this.node.static ? "class" : "prototype"}-${mapping[this.kind]}`;
  }
  isStatic () {
    this.node.static;
  }
}


// Classless, cannot tell if static or not //
//
// export const NO_NAME = "void";
//
// export const makeIdentifierName = (kind, node) => {
//   if (node.type === "Identifier") {
//     return `${node.name}(${kind === null ? '' : kind})`;
//   }
//   throw new Error(`Invalid node for variable naming`);
// };
//
// export const makeFieldName = (node) => {
//   let kind;
//   if (node.type === "Property") {
//     if (node.kind === "init") {
//       kind = `object-${node.method ? : "method" : "value"}`;
//     } else {
//       kind = `object-${node.kind}`;
//     }
//   } else if (node.type === "MethodDefinition") {
//     kind = `${node.static ? "class" : "prototype"}-${node.kind}`;
//   } else {
//     throw new Error(`Invalid node for field naming`)
//   }
//   let name = "@dynamic";
//   if (node.key.type === "Literal" && typeof node.key.value === "string" && !Reflect.getOwnPropertyDescriptor(node.key.value)) {
//     name = JSON.stringify(node.key.value);
//   } else if (!node.computed) {
//     name = node.key.name;
//   }
//   return `.${name}(${kind})`;
// }
