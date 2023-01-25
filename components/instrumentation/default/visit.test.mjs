import { assertEqual } from "../../__fixture__.mjs";
import { makeLocation } from "../../location/index.mjs";
import { createCounter } from "../../util/index.mjs";
import { createMirrorSourceMap } from "../../source/index.mjs";
import { normalize, parse, generate } from "./__fixture__.mjs";
import { visit } from "./visit.mjs";

const {
  JSON: { stringify: stringifyJSON },
  Set,
} = globalThis;

const instrument = (file, whitelist) =>
  generate(
    visit(
      parse(file.content, {
        ecmaVersion: 2021,
        sourceType: file.type,
        locations: true,
        allowAwaitOutsideFunction: file.type === "module",
      }),
      {
        url: file.url,
        apply: "APPLY",
        eval: { hidden: "EVAL", aliases: ["eval"] },
        mapping: createMirrorSourceMap(file),
        whitelist: new Set(whitelist),
        counter: createCounter(0),
      },
    ),
  );

const makeCodeLocation = (url, line, column) =>
  stringifyJSON(makeLocation(url, { line, column }));

// expression body //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "(() => 123);",
      type: "script",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      (() => {
        var
          APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
          APPLY_RETURN,
          APPLY_RETURNED = true;
        APPLY.recordApply(
          APPLY_BUNDLE_TAB,
          ${makeCodeLocation("protocol://host/script.js", 1, 1)},
          APPLY.empty,
          [],
        );
        try {
          return APPLY_RETURN = 123;
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("protocol://host/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("protocol://host/script.js", 1, 1)},
              APPLY_RETURN,
            );
          }
        }
      });
    `,
    "script",
  ),
);

// subclass //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "(class C extends D {\nconstructor () { 123; } })",
      type: "script",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      (class C extends D { constructor () {
        var
          APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
          APPLY_RETURN,
          APPLY_RETURNED = true;
        APPLY.recordApply(
          APPLY_BUNDLE_TAB,
          ${makeCodeLocation("protocol://host/script.js", 2, 12)},
          APPLY.empty,
          [],
        );
        try {
          {
            123;
          }
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("protocol://host/script.js", 2, 12)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("protocol://host/script.js", 2, 12)},
              APPLY_RETURN,
            );
          }
        }
      }
    });
    `,
    "script",
  ),
);

// parameters && return //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "((x, y = 123, ...rest) => { return 456; });",
      type: "script",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      ((APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, ...APPLY_ARGUMENT_2) => {
        var
          APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
          APPLY_RETURN,
          APPLY_RETURNED = true;
        APPLY.recordApply(
          APPLY_BUNDLE_TAB,
          ${makeCodeLocation("protocol://host/script.js", 1, 1)},
          APPLY.empty,
          [APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, APPLY_ARGUMENT_2],
        );
        try {
          var
            x = APPLY_ARGUMENT_0,
            y = APPLY_ARGUMENT_1 === void 0 ? 123 : APPLY_ARGUMENT_1,
            rest = APPLY_ARGUMENT_2;
          {
            return APPLY_RETURN = 456;
          }
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("protocol://host/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("protocol://host/script.js", 1, 1)},
              APPLY_RETURN,
            );
          }
        }
      });
    `,
    "script",
  ),
);

// generator //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "(function* () { yield* 123; });",
      type: "script",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      (function* () {
        var
          APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
          APPLY_RETURN,
          APPLY_RETURNED = true,
          APPLY_YIELD,
          APPLY_YIELD_TAB;
        APPLY.recordApply(
          APPLY_BUNDLE_TAB,
          ${makeCodeLocation("protocol://host/script.js", 1, 1)},
          this,
          [],
        );
        try {
          {
            (
              APPLY_YIELD = 123,
              APPLY_YIELD_TAB = APPLY.getFreshTab(),
              APPLY.recordYield(APPLY_YIELD_TAB, true, APPLY_YIELD),
              APPLY_YIELD = yield* APPLY_YIELD,
              APPLY.recordResume(APPLY_YIELD_TAB, APPLY_YIELD),
              APPLY_YIELD
            );
          }
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("protocol://host/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("protocol://host/script.js", 1, 1)},
              APPLY_RETURN,
            );
          }
        }
      });
    `,
    "script",
  ),
);

// asynchronous //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: `(async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });`,
      type: "script",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      (async () => {
        var
          APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
          APPLY_RETURN,
          APPLY_RETURNED = true,
          APPLY_AWAIT,
          APPLY_AWAIT_TAB;
        APPLY.recordApply(
          APPLY_BUNDLE_TAB,
          ${makeCodeLocation("protocol://host/script.js", 1, 1)},
          APPLY.empty,
          [],
        );
        try {
          {
            try {
              (
                APPLY_AWAIT = 123,
                APPLY_AWAIT_TAB = APPLY.getFreshTab(),
                APPLY.recordAwait(APPLY_AWAIT_TAB, APPLY_AWAIT),
                APPLY_AWAIT = await APPLY_AWAIT,
                APPLY.recordResolve(APPLY_AWAIT_TAB, APPLY_AWAIT),
                APPLY_AWAIT_TAB = void 0,
                APPLY_AWAIT
              );
            } catch (APPLY_ERROR) {
              if (APPLY_AWAIT_TAB !== void 0) {
                APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
                APPLY_AWAIT_TAB = void 0;
              }
              let error = APPLY_ERROR;
              {
                456;
              }
            } finally {
              789;
            }
          }
        } catch (APPLY_ERROR) {
          if (APPLY_AWAIT_TAB !== void 0) {
            APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
          }
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("protocol://host/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("protocol://host/script.js", 1, 1)},
              APPLY_RETURN,
            );
          }
        }
      });
    `,
    "script",
  ),
);

// not instrumented //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: `
        (async function* () {
          await 'promise';
          yield 'iterator';
          try { 123; } finally { 456; }
          return 123;
        });
      `,
      type: "script",
    },
    [],
  ),
  normalize(
    `
      (async function* () {
        await 'promise';
        yield 'iterator';
        try { 123; } finally { 456; }
        return 123;
      });
    `,
    "script",
  ),
);

// module >> try without finally //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "try { 123; } catch { 456; }",
      type: "module",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_AWAIT,
        APPLY_AWAIT_TAB;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_AWAIT_TAB !== void 0) {
          APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
          APPLY_AWAIT_TAB = void 0;
        }
        {
          456;
        }
      }
    `,
    "module",
  ),
);

// module >> try without catch //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js",
      content: "try { 123; } finally { 456; }",
      type: "module",
    },
    ["protocol://host/script.js"],
  ),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_AWAIT,
        APPLY_AWAIT_TAB;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_AWAIT_TAB !== void 0) {
          APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
          APPLY_AWAIT_TAB = void 0;
        }
      } finally {
        456;
      }
    `,
    "module",
  ),
);

// CallExpression //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js#hash",
      content: "f();",
      type: "script",
    },
    [],
  ),
  normalize("f()", "script"),
);

// CallExpression >> eval //
assertEqual(
  instrument(
    {
      url: "protocol://host/script.js#hash",
      content: "eval(123, 456);",
      type: "script",
    },
    [],
  ),
  normalize(
    `eval(
      EVAL(
        "protocol://host/script.js",
        "1-0",
        123,
      ),
      456,
    );`,
    "script",
  ),
);
