import { strict as Assert } from "assert";
import { test } from "./__fixture__.mjs";

import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-identifier.mjs";
import "./visit-pattern.mjs";
import "./visit-class.mjs";
import "./visit-closure.mjs";

Error.stackTraceLimit = Infinity;

// ArrowFunctionExpression //

{
  const entities = test("((x, y = null, ...z) => 123);", {
    output: `
        (($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
          var
            $_RECORD_RETURN = $.recordApply(1, this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            var
              x = $_ARGUMENT_0,
              y = $_ARGUMENT_1 === $.undefined ? null : $_ARGUMENT_1,
              z = $_ARGUMENT_2;
            return $_SUCCESS = 123;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        });
      `,
    entities: null,
  });
  delete entities[0].loc;
  delete entities[0].span;
  Assert.deepEqual(entities, [
    {
      type: "function",
      caption: {
        name: null,
        origin: "ArrowFunctionExpression",
      },
      index: 1,
      children: [],
      static: false,
    },
  ]);
}

// Function Expression //

{
  const entities = test("(function f () { return; });", {
    output: `
        (function f () {
          var
            $_RECORD_RETURN = $.recordApply(1, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = $.undefined;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        });
      `,
    entities: null,
  });
  delete entities[0].loc;
  delete entities[0].span;
  Assert.deepEqual(entities, [
    {
      type: "function",
      caption: {
        name: "f",
        origin: "FunctionExpression",
      },
      index: 1,
      children: [],
      static: false,
    },
  ]);
}

{
  const entities = test("(function () { return 123; });", {
    output: `
        (function () {
          var
            $_RECORD_RETURN = $.recordApply(1, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = 123;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        });
      `,
    entities: null,
  });
  delete entities[0].loc;
  delete entities[0].span;
  Assert.deepEqual(entities, [
    {
      type: "function",
      caption: {
        name: null,
        origin: "FunctionExpression",
      },
      index: 1,
      children: [],
      static: false,
    },
  ]);
}

// Function Declaration //

{
  const entities = test("function f () { return; }", {
    output: `
        function f () {
          var
            $_RECORD_RETURN = $.recordApply(1, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = $.undefined;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        }
      `,
    entities: null,
  });
  delete entities[0].loc;
  delete entities[0].span;
  Assert.deepEqual(entities, [
    {
      type: "function",
      caption: {
        name: "f",
        origin: "FunctionDeclaration",
      },
      index: 1,
      children: [],
      static: false,
    },
  ]);
}

{
  const entities = test("export default function () { return 123; }", {
    output: `
        export default function () {
          var
            $_RECORD_RETURN = $.recordApply(1, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = 123;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        }
      `,
    entities: null,
    type: "module",
  });
  delete entities[0].loc;
  delete entities[0].span;
  Assert.deepEqual(entities, [
    {
      type: "function",
      caption: {
        name: "default",
        origin: "FunctionDeclaration",
      },
      index: 1,
      children: [],
      static: false,
    },
  ]);
}

// Method //

{
  const entities = test("(class { static foo () { return 123; } })", {
    output: `
        (class { static foo () {
          var
            $_RECORD_RETURN = $.recordApply(2, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = 123;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $_RECORD_RETURN($_FAILURE, $_SUCCESS);
          }
        } })
      `,
    entities: null,
    type: "module",
  });
  delete entities[0].children[0].loc;
  delete entities[0].children[0].span;
  Assert.deepEqual(entities, [
    {
      type: "class",
      caption: { origin: "ClassExpression", name: null },
      index: 1,
      children: [
        {
          type: "function",
          caption: { origin: "MethodDefinition", name: "foo" },
          index: 2,
          children: [],
          static: true,
        },
      ],
    },
  ]);
}
