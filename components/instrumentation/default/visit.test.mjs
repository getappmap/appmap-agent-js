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

  const normalize = (code, source) =>
    generate(parse(code, { ecmaVersion: 2021, sourceType: source }));

  const instrument = (code, source) =>
    generate(
      visit(
        parse(code, { ecmaVersion: 2021, sourceType: source }),
        "root",
        null,
        {
          runtime: "$",
          exclusion: createExclusion(["g"]),
          naming: createCounter,
        },
      ),
    );

  // Asynchronous arrow with expression body //

  assertEqual(
    instrument("(async (x, y = null, ...z) => await 123);", "script"),
    normalize(
      `
      (async ($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
        var
          $_APPLY_ID = $.recordBeginApply('root/body/0/expression', this, [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2]),
          $_FAILURE = $.empty,
          $_SUCCESS = $.empty,
          $_JUMP = null,
          $_JUMP_ID = null;
        try {
          var
            x = $_ARGUMENT_0,
            y = $_ARGUMENT_1 === void 0 ? null : $_ARGUMENT_1,
            z = $_ARGUMENT_2;
          return $_SUCCESS = (
            $_JUMP = 123,
            $_JUMP_ID = $.recordBeforeJump(),
            $_JUMP = await $_JUMP,
            $.recordAfterJump($_JUMP_ID),
            $_JUMP_ID = null,
            $_JUMP
          );
        } catch ($_ERROR) {
          if ($_JUMP_ID !== null) {
            $.recordAfterJump($_JUMP_ID);
            $_JUMP_ID = null;
          }
          throw $_FAILURE = $_ERROR;
        } finally {
          $.recordEndApply($_APPLY_ID, $_FAILURE, $_SUCCESS);
        }
      });
    `,
      "script",
    ),
  );

  // generator function declaration //

  for (const [code1, code2] of [
    ["", "void 0"],
    ["123", "123"],
  ]) {
    assertEqual(
      instrument(
        `function* f () { yield 456; yield* 789; return ${code1}; };`,
        "script",
      ),
      normalize(
        `
        function* f () {
          var
            $_APPLY_ID = $.recordBeginApply('root/body/0', this, []),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty,
            $_JUMP = null,
            $_JUMP_ID = null;
          try {
            (
              $_JUMP = 456,
              $_JUMP_ID = $.recordBeforeJump(),
              $_JUMP = yield $_JUMP,
              $.recordAfterJump($_JUMP_ID),
              $_JUMP_ID = null,
              $_JUMP
            );
            (
              $_JUMP = 789,
              $_JUMP_ID = $.recordBeforeJump(),
              $_JUMP = yield* $_JUMP,
              $.recordAfterJump($_JUMP_ID),
              $_JUMP_ID = null,
              $_JUMP
            );
            return $_SUCCESS = ${code2};
          } catch ($_ERROR) {
            if ($_JUMP_ID !== null) {
              $.recordAfterJump($_JUMP_ID);
              $_JUMP_ID = null;
            }
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordEndApply($_APPLY_ID, $_FAILURE, $_SUCCESS);
          }
        };
      `,
        "script",
      ),
    );
  }

  // try statement //

  assertEqual(
    instrument(
      `
      try { } catch (error) { 123; }
      try { } finally { 123; }
    `,
      "module",
    ),
    normalize(
      `
      let $_JUMP_ID = null
      try { } catch ($_ERROR) {
        if ($_JUMP_ID !== null) {
          $.recordAfterJump($_JUMP_ID);
          $_JUMP_ID = null;
        }
        let error = $_ERROR;
        {
          123;
        }
      }
      try { } catch ($_ERROR) {
        if ($_JUMP_ID !== null) {
          $.recordAfterJump($_JUMP_ID);
          $_JUMP_ID = null;
        }
      } finally {
        123;
      }
      `,
      "module",
    ),
  );

  assertEqual(
    instrument("function g () { return 123; };", "script"),
    normalize("function g () { return 123; };", "script"),
  );
};

testAsync();
