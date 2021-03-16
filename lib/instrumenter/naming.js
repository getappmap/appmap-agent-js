
//////////////
// Identity //
//////////////

class Identity {
  constructor (identifier) {
    this.identifier = identifier;
  }
  isIdentified () {
    return this.identifier !== null;
  }
  getIdentifier () {
    if (this.identifier === null) {
      throw new Error(`Identity is not identified`);
    }
    return this.identifier;
  }
}

// ExpressionIdentity //

const ExpressionIdentity {
  constructor (identifier, naming) {
    super(identifier);
    super.fieldNaming = naming;
  }
  getNaming () {
    return this.fieldNaming;
  }
}

export const ArrowExpressionIdentity {
  constructor (naming) {
    super(null, naming);
  }
}

export const FunctionExpressionIdentity {}

export const ClassExpressionIdentity {
  constructor (identifier, naming, derived) {
    super(identifier, naming);
    this.fieldDerived = derived;
  }
  isDerived () {
    this.fieldDerived;
  }
}

// DeclarationIdentity //

const DeclarationIdentity {
  constructor (identifier) {
    if (identifier === null) {
      throw new Error(`Declaration identity must be identified`);
    }
    super(identifier);
  }
}

export const FunctionDeclarationIdentity {}

export const ClassDeclarationIdentity {
  constructor (identifier, derived) {
    super(identifier);
    this.fieldDerived = derived;
  }
  isDerived () {
    this.fieldDerived;
  }
}

////////////
// Naming //
////////////

class Naming {
  constructor (name) {
    this.fieldName = name;
  }
  getName () {
    if (this.fieldName === null) {
      throw new Error(`Cannot access the name of a dynamic naming`);
    }
    return this.fieldName;
  }
  isStatic () {
    return this.fieldName === null;
  }
  isDynamic () {
    return this.fieldName !== null;
  }
}

// UnknwonNaming //

export class

// VariableNaming //

export class VariableNaming extends Naming {
  constructor (name, kind) {
    if (name === null) {
      logger.error(`Variable naming should always be known statically`);
      super('APPMAP_ERROR');
    } else {
      super(name);
    }
    this.fieldKind = kind;
  }
  getKind () {
    return this.fieldKind;
  }
}

// ObjectNaming //

const x = {
  foo: {
    bar () {}
  }
}

new FunctionExpressionIdentity(
  null,
  new MethodObjectNaming(
    "bar",
    new ValueObjectNaming(
      "foo",
      new VariableNaming("x", "const"))));

const x = {
  foo: class {
    bar () {}
  }
}

new MethodClassNaming(
  "bar",
  new ValueObjectNaming(
    "foo",
    new VariableNaming("x", "const")))

class ObjectNaming extends Naming {
  constructor (name, naming) {
    super(name);
    this.fieldObjectNaming = naming;
  }
  getObjectNaming () {
    return this.fieldObjectNaming;
  }
}

export class MethodObjectNaming extends ObjectNaming {}

export class GetterObjectNaming extends ObjectNaming {}

export class SetterObjectNaming extends ObjectNaming {}

export class ValueObjectNaming extends ObjectNaming {}

/////////////////
// ClassNaming //
/////////////////

class ClassNaming extends Naming {
  constructor (name, naming, node) {
    super(name);
    this.fieldClassNaming = naming;
    this.fieldClassDerived = derived;
  }
  getClassNaming () {
    return this.fieldClassNaming;
  }
  isClassDerived () {
    return this.fieldClassDerived;
  }
  isClassIdentified () {
    return this.fieldClassIdentifier !== null;
  }
  getClassIdentifier () {
    if (this.fieldClassIdentifier === null) {
      throw new Error(`Cannot access the identifier of a non-identified class`);
    }
    return this.fieldClassIdentifier;
  }
}

export class ConstructorClassNaming extends ClassNaming {
  constructor (naming, derived, identifier) {
    super("constructor", naming, derived, identifier);
  }
}

export class MethodClassNaming extends ClassNaming {
  constructor (name, naming, derived, identifier, static) {
    super(name, naming, derivedm identifier, static);
    this.fieldStatic = static;
  }
  isInstanceMethod () {
    return !this.static;
  }
  isClassMethod () {
    return this.static;
  }
}
