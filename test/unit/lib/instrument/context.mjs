import { strict as Assert } from 'assert';
import {getVoidContext, IdentifierContext, MethodDefinitionContext, PropertyContext} as Context from '../../../../lib/instrumenter/context.mjs';

/////////////////
// VoidContext //
/////////////////

{
  const context = Context.getVoidContext();
  Assert.equal(context.isStatic(), false);
  Assert.equal(context.getName(), '#dynamic|void');
}

/////////////////////
// VariableContext //
/////////////////////

{
  const context = new Context.VariableContext({
    type: 'Literal',
    value: 123,
  }, "assignment");
  Assert.equal(context.getName(), `@__APPMAP_ERROR__|assignment`);
}

{
  const context = new Context.VariableContext({
    type: 'Identifier',
    name: 'foo',
  }, "assignment");
  Assert.equal(context.getName(), `@foo|assignment`);
}

//////////////////////
// ObjectKeyContext //
//////////////////////

{
  const context = new Context.ObjectKeyContext({
    type: 'Literal',
    value: 123,
  });
  Assert.equal(context.getName(), `.__APPMAP_ERROR__|object-value`);
}

{
  const context = new Context.ObjectKeyContext({
    type: 'Property',
    kind: "init",
    method: true,
    shorthand: false,
    computed: false,
    key: {
      type: "Identifier",
      name: "foo"
    },
    value: {
      type: "FunctionExpression",
      id: null,
      async: false,
      generator: false,
      params: [],
      body: {
        type: "BlockStatement",
        body: []
      }
    }
  });
  Assert.equal(context.getName(), `.foo|object-method`);
}

{
  const context = new Context.ObjectKeyContext({
    type: 'Property',
    kind: "init",
    method: false,
    shorthand: false,
    computed: true,
    key: {
      type: "Literal",
      value: "foo"
    },
    value: {
      type: "Literal",
      name: "bar"
    }
  });
  Assert.equal(context.getName(), `["foo"]|object-value`);
}

{
  const context = new Context.ObjectKeyContext({
    type: 'Property',
    kind: "init",
    method: false,
    shorthand: false,
    computed: true,
    key: {
      type: "Literal",
      value: 123
    },
    value: {
      type: "Literal",
      name: "bar"
    }
  });
  Assert.equal(context.getName(), `[#dynamic]|object-value`);
}

/////////////////////
// ClassKeyContext //
/////////////////////

{
  const context = new Context.ClassKeyContext({
    type: 'Literal',
    value: 123,
  });
  Assert.equal(context.isStatic(), false);
  Assert.equal(context.getName(), `.__APPMAP_ERROR__|prototype-method`);
}

{
  const context = new Context.ClassKeyContext({
    type: 'MethodDefinition',
    kind: "method",
    static: true,
    computed: false,
    key: {
      type: "Identifier",
      name: "foo"
    },
    value: {
      type: "FunctionExpression",
      id: null,
      async: false,
      generator: false,
      params: [],
      body: {
        type: "BlockStatement",
        body: []
      }
    }
  });
  Assert.equal(context.isStatic(), true);
  Assert.equal(context.getName(), `.foo|class-method`);
}
