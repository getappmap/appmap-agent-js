import { strict as Assert } from "assert";
import { buildAllAsync } from "../../../build.mjs";
import { testVisitor } from "./__fixture__.mjs";
import VisitFunction from "./visit-function.mjs";

const mainAsync = async () => {
  const visitors = VisitFunction(await buildAllAsync(["util"]));

  // ArrowFunctionExpression //

  {
    const sieve = testVisitor(
      "((x, y = null, ...z) => 123);",
      ["body", 0, "expression"],
      visitors,
      {
        context: { runtime: "$" },
        entity: { index: 123 },
        info: { name: null, params: ["x", "y = null", "...z"], static: false },
        output: `
          (($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
            var
              $_AFTER_ID = $.recordBeforeApply(123, this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
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
      },
    );
    Assert.deepEqual(sieve(["foo", "bar"]), [["foo", "bar"], []]);
  }

  // Static FunctionExpression //

  testVisitor(
    "(class { static foo () { bar; } });",
    ["body", 0, "expression", "body", "body", 0, "value"],
    visitors,
    {
      context: { runtime: "$" },
      entity: { index: 123 },
      info: { name: null, params: [], static: true },
      output: `
        (class { static foo () {
          var
            $_AFTER_ID = $.recordBeforeApply(123, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            bar;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
          }
        } });
      `,
    },
  );

  // FunctionDeclaration //

  testVisitor("function f () { foo }", ["body", 0], visitors, {
    context: { runtime: "$" },
    entity: { index: 123 },
    info: { name: "f", params: [], static: false },
    output: `
        function f () {
          var
            $_AFTER_ID = $.recordBeforeApply(123, this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            foo;
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
          }
        }
      `,
  });

  // ReturnStatement //

  testVisitor(
    "function f () { return 123; }",
    ["body", 0, "body", "body", 0],
    visitors,
    {
      context: { runtime: "$" },
      output: `function f () { return $_SUCCESS = 123; }`,
    },
  );

  testVisitor(
    "function f () { return; }",
    ["body", 0, "body", "body", 0],
    visitors,
    {
      context: { runtime: "$" },
      output: `function f () { return $_SUCCESS = void 0; }`,
    },
  );
};

mainAsync();
