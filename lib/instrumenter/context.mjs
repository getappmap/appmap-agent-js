import Logger from '../logger.mjs';

const logger = new Logger(import.meta.url);

class Context {
  getName() {
    return `${this.getRawName()}|${this.getKind()}`;
  }
  isStatic() {
    return false;
  }
}

////////////////
// VoidContext //
////////////////

class VoidContext extends Context {
  getRawName() {
    return '#dynamic';
  }
  getKind() {
    return 'void';
  }
}

const context = new VoidContext();

export const getVoidContext = () => context;

////////////////////
// VariableContext //
////////////////////

export class VariableContext extends Context {
  // Kind = "assignment" | "let" | "const" | "var" | "function" | "class"
  constructor(node, kind) {
    super();
    if (node.type === 'Identifier') {
      this.node = node;
    } else {
      logger.error(
        `Expected an Identifier node for VariableContext, got ${node.type}`,
      );
      this.node = {
        type: 'Identifier',
        name: '__ERROR__',
      };
    }
    this.kind = kind;
  }
  getRawName() {
    // console.assert(this.node.type === "Identifier")
    return `@${this.node.name}`;
  }
  getKind() {
    return this.kind;
  }
}

///////////////
// KeyContext //
///////////////

class KeyContext extends Context {
  constructor(node) {
    // console.assert(this.node.type === "Property" || this.node.type === "MethodDefinition");
    super();
    this.node = node;
  }
  getRawName() {
    // console.assert(this.node.type === "Property" || this.node.type === "MethodDefinition");
    if (!this.node.computed) {
      return `.${this.node.key.name}`;
    }
    if (
      this.node.key.type === 'Literal' &&
      typeof this.node.key.value === 'string' &&
      !Reflect.getOwnPropertyDescriptor(this.node.key, 'regex')
    ) {
      return `[${JSON.stringify(this.node.key.value)}]`;
    }
    return '[#dynamic]';
  }
}

const mapping = {
  get: 'getter',
  set: 'setter',
  method: 'method',
  init: 'value',
  constructor: 'constructor',
};

export class ObjectKeyContext extends KeyContext {
  constructor(node) {
    if (node.type === 'Property') {
      super(node);
    } else {
      logger.error(
        `Expected a Property node for ObjectKeyContext, got: ${node.type}`,
      );
      super({
        type: 'Property',
        kind: 'init',
        method: false,
        shorthand: false,
        computed: false,
        key: {
          type: 'Identifier',
          name: '__ERROR__',
        },
        value: {
          type: 'Identifier',
          name: '__ERROR__>',
        },
      });
    }
  }
  getKind() {
    return `object-${this.node.method ? 'method' : mapping[this.node.kind]}`;
  }
}

export class ClassKeyContext extends KeyContext {
  constructor(node) {
    if (node.type === 'MethodDefinition') {
      super(node);
    } else {
      logger.error(
        `Expected a MethodDefinition node for ClassKeyContext, got: ${node.type}`,
      );
      super({
        type: 'MethodDefinition',
        kind: 'method',
        computed: false,
        static: false,
        key: {
          type: 'Identifier',
          name: '__ERROR__',
        },
        value: {
          type: 'FunctionExpression',
          id: null,
          params: [],
          generator: false,
          async: false,
          body: {
            type: 'BlockStatement',
            body: [],
          },
        },
      });
    }
  }
  getKind() {
    return `${this.node.static ? 'class' : 'prototype'}-${
      mapping[this.node.kind]
    }`;
  }
  isStatic() {
    return this.node.static;
  }
}
