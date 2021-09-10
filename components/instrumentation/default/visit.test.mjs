import { strict as Assert } from "assert";
import { parse } from "acorn";
import { generate } from "escodegen";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Visit from "./visit.mjs";

Error.stackTraceLimit = Infinity;

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestDependenciesAsync(import.meta.url);
  const { createCounter } = await buildTestComponentAsync("util");
  const { createExclusion } = await buildTestComponentAsync("naming");

  const { visit } = Visit(dependencies);

  const normalize = (code) => generate(parse(code, { ecmaVersion: 2020 }));

  const instrument = (code) =>
    generate(
      visit(parse(code, { ecmaVersion: 2020 }), "root", null, {
        runtime: "$",
        exclusion: createExclusion(["g"]),
        naming: createCounter,
      }),
    );

  // ArrowFunctionExpression //

  assertEqual(
    instrument("(async (x, y = null, ...z) => await 123);"),
    normalize(`
      (async ($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
        var
          $_APPLY_ID = $.recordBeginApply('root/body/0/expression', this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
          $_FAILURE = $.empty,
          $_SUCCESS = $.empty;
        try {
          var
            x = $_ARGUMENT_0,
            y = $_ARGUMENT_1 === void 0 ? null : $_ARGUMENT_1,
            z = $_ARGUMENT_2;
          return $_SUCCESS = await $.recordAwait(123);
        } catch ($_ERROR) {
          throw $_FAILURE = $_ERROR;
        } finally {
          $.recordEndApply($_APPLY_ID, $_FAILURE, $_SUCCESS);
        }
      });
    `),
  );

  for (const [code1, code2] of [
    ["", "void 0"],
    ["123", "123"],
  ]) {
    assertEqual(
      instrument(`function* f () { yield 456; yield* 789; return ${code1}; };`),
      normalize(`
        function* f () {
          var
            $_APPLY_ID = $.recordBeginApply('root/body/0', this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty;
          try {
            yield* $.recordYield(456);
            yield* $.recordYieldAll(789);
            return $_SUCCESS = ${code2};
          } catch ($_ERROR) {
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordEndApply($_APPLY_ID, $_FAILURE, $_SUCCESS);
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
