import { assertEqual } from "../../__fixture__.mjs";
import * as Acorn from "acorn";
import Escodegen from "escodegen";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Visit from "./visit.mjs";

const { parse } = Acorn;
const { generate } = Escodegen;
const { stringify: stringifyJSON } = JSON;

Error.stackTraceLimit = Infinity;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { visit } = Visit(dependencies);
const { makeLocation, stringifyLocation } = await buildTestComponentAsync(
  "location",
);
const { createMirrorSourceMap } = await buildTestComponentAsync("source");

const normalize = (code, source) =>
  generate(parse(code, { ecmaVersion: 2021, sourceType: source }));

const instrument = (file, whitelist) =>
  generate(
    visit(
      parse(file.content, {
        ecmaVersion: 2021,
        sourceType: file.type,
        locations: true,
      }),
      {
        url: file.url,
        runtime: "$",
        mapping: createMirrorSourceMap(file),
        whitelist: new Set(whitelist),
      },
    ),
  );

// Asynchronous arrow with expression body //

assertEqual(
  instrument(
    {
      url: "file:///script.js",
      content: "(async (x, y = null, ...z) => await 123);",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
    (async ($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
      var
        $_APPLY_ID = $.recordBeginApply(
          ${stringifyJSON(
            stringifyLocation(makeLocation("file:///script.js", 1, 1)),
          )},
          $.empty,
          [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2],
        ),
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
      {
        url: "file:///script.js",
        content: `function* f () { yield 456; yield* 789; return ${code1}; };`,
        type: "script",
      },
      ["file:///script.js"],
    ),
    normalize(
      `
      function* f () {
        var
          $_APPLY_ID = $.recordBeginApply(
            ${stringifyJSON(
              stringifyLocation(makeLocation("file:///script.js", 1, 0)),
            )},
            this,
            []
          ),
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

// super constructor should not access this //

assertEqual(
  instrument(
    {
      url: "file:///script.js",
      content: "class C extends Object {constructor\n() { super(); } }",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      class C extends Object {
        constructor () {
          var
            $_APPLY_ID = $.recordBeginApply(
              ${stringifyJSON(
                stringifyLocation(makeLocation("file:///script.js", 2, 0)),
              )},
              $.empty,
              [],
            ),
            $_FAILURE = $.empty,
            $_SUCCESS = $.empty,
            $_JUMP = null,
            $_JUMP_ID = null;
          try {
            super();
          } catch ($_ERROR) {
            if ($_JUMP_ID !== null) {
              $.recordAfterJump($_JUMP_ID);
              $_JUMP_ID = null;
            }
            throw $_FAILURE = $_ERROR;
          } finally {
            $.recordEndApply($_APPLY_ID, $_FAILURE, $_SUCCESS);
          }
        }
      }
    `,
  ),
);

// try statement //

assertEqual(
  instrument(
    {
      url: "file:///script.js",
      content: `
        try { } catch (error) { 123; }
        try { } finally { 123; }
      `,
      type: "module",
    },
    ["file:///script.js"],
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
  instrument(
    {
      url: "file:///script.js",
      content: "function g () { return 123; };",
      type: "script",
    },
    [],
  ),
  normalize("function g () { return 123; };", "script"),
);
