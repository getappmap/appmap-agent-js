import { strict as Assert } from "assert";
import { test } from "./__fixture__.mjs";
import "./visit-program.mjs";
import "./visit-statement.mjs";
import "./visit-expression.mjs";
import "./visit-pattern.mjs";
import "./visit-identifier.mjs";
import "./visit-class.mjs";
import "./visit-closure.mjs";

Error.stackTraceLimit = Infinity;

const testClosure = (input, output) => {
  const [{ loc, span, ...rest1 }, ...rest2] = test(input, {
    output,
    entities: null,
    type: "module",
  });
  Assert.ok(Array.isArray(span));
  Assert.equal(typeof loc, "object");
  Assert.deepEqual(rest2, []);
  return rest1;
};

// ArrowFunctionExpression //

Assert.deepEqual(
  testClosure(
    "((x, y = null, ...z) => 123);",
    `
      (($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
        var
          $_AFTER_ID = $.recordBeforeApply(1, this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
          $_FAILURE = $.empty,
          $_SUCCESS = $.empty;
        try {
          var
            x = $_ARGUMENT_0,
            y = $_ARGUMENT_1 === void 0 ? null : $_ARGUMENT_1,
            z = $_ARGUMENT_2;
          return $_SUCCESS = 123;
        } catch ($_ERROR) {
          throw $_FAILURE = $_ERROR;
        } finally {
          $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
        }
      });
    `,
  ),
  {
    type: "function",
    caption: {
      name: null,
      origin: "ArrowFunctionExpression",
    },
    params: ["x", "y = null", "...z"],
    index: 1,
    children: [],
    static: false,
  },
);

// Function Expression //

testClosure(
  "(function f () { return; });",
  `
    (function f () {
      var
        $_AFTER_ID = $.recordBeforeApply(1, this, []),
        $_FAILURE = $.empty,
        $_SUCCESS = $.empty;
      try {
        return $_SUCCESS = void 0;
      } catch ($_ERROR) {
        throw $_FAILURE = $_ERROR;
      } finally {
        $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
      }
    });
  `,
  {
    type: "function",
    caption: {
      name: "f",
      origin: "FunctionExpression",
    },
    params: [],
    index: 1,
    children: [],
    static: false,
  },
);

testClosure(
  "(function () { return 123; });",
  `
    (function () {
      var
        $_AFTER_ID = $.recordBeforeApply(1, this, []),
        $_FAILURE = $.empty,
        $_SUCCESS = $.empty;
      try {
        return $_SUCCESS = 123;
      } catch ($_ERROR) {
        throw $_FAILURE = $_ERROR;
      } finally {
        $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
      }
    });
  `,
  {
    type: "function",
    caption: {
      name: null,
      origin: "FunctionExpression",
    },
    params: [],
    index: 1,
    children: [],
    static: false,
  },
);

// Function Declaration //

testClosure(
  "function f () { return; }",
  `
    function f () {
      var
        $_AFTER_ID = $.recordBeforeApply(1, this, []),
        $_FAILURE = $.empty,
        $_SUCCESS = $.empty;
      try {
        return $_SUCCESS = void 0;
      } catch ($_ERROR) {
        throw $_FAILURE = $_ERROR;
      } finally {
        $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
      }
    }
  `,
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
);

testClosure(
  "export default function () { return 123; }",
  `
    export default function () {
      var
        $_AFTER_ID = $.recordBeforeApply(1, this, []),
        $_FAILURE = $.empty,
        $_SUCCESS = $.empty;
      try {
        return $_SUCCESS = 123;
      } catch ($_ERROR) {
        throw $_FAILURE = $_ERROR;
      } finally {
        $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
      }
    }
  `,
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
);

// // Method //
//
// {
//   const entities = test("(class { static foo () { return 123; } })", {
//     output: `
//         (class { static foo () {
//           var
//             $_AFTER_ID = $.recordApply(2, this, []),
//             $_FAILURE = $.empty,
//             $_SUCCESS = $.empty;
//           try {
//             return $_SUCCESS = 123;
//           } catch ($_ERROR) {
//             throw $_FAILURE = $_ERROR;
//           } finally {
//             $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
//           }
//         } })
//       `,
//     entities: null,
//     type: "module",
//   });
//   delete entities[0].children[0].loc;
//   delete entities[0].children[0].span;
//   Assert.deepEqual(entities, [
//     {
//       type: "class",
//       caption: { origin: "ClassExpression", name: null },
//       index: 1,
//       children: [
//         {
//           type: "function",
//           caption: { origin: "MethodDefinition", name: "foo" },
//           index: 2,
//           children: [],
//           static: true,
//         },
//       ],
//     },
//   ]);
// }
