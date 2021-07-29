import { strict as Assert } from "assert";
import { parse } from "acorn";
import { generate } from "escodegen";
import { buildTestAsync } from "../../../build/index.mjs";
import Visit from "./visit.mjs";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync({ ...import.meta, deps: ["util"] });
  const {
    util: { createCounter },
  } = dependencies;
  const { visit } = Visit(dependencies);

  const normalize = (code) => generate(parse(code, { ecmaVersion: 2020 }));

  const instrument = (code) =>
    generate(
      visit(parse(code, { ecmaVersion: 2020 }), "root", null, {
        runtime: "$",
        exclude: new Set("g"),
        naming: createCounter,
      }),
    );

  // ArrowFunctionExpression //

  assertEqual(
    instrument("((x, y = null, ...z) => 123);"),
    normalize(`
      (($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
        var
          $_AFTER_ID = $.recordBeforeApply('root/body/0/expression', this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
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
    `),
  );

  for (const [code1, code2] of [
    ["", "void 0"],
    ["123", "123"],
  ]) {
    assertEqual(
      instrument(`function f () { return ${code1}; };`),
      normalize(`
        function f () {
          var
            $_AFTER_ID = $.recordBeforeApply('root/body/0', this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            return $_SUCCESS = ${code2};
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordAfterApply($_AFTER_ID, $_FAILURE, $_SUCCESS);
          }
        };
      `),
    );
  }

  assertEqual(
    instrument("function g () { return 123; };"),
    normalize("function g () { return 123; };"),
  );
};

testAsync();
