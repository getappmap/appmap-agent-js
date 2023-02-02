import { assertEqual } from "../../__fixture__.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import { createCounter } from "../../util/index.mjs";
import { createMirrorSourceMap } from "../../source/index.mjs";
import { hashFile } from "../../hash/index.mjs";
import { normalize, parse, generate } from "./__fixture__.mjs";
import { visit } from "./visit.mjs";

const {
  JSON: { stringify: stringifyJSON },
  Set,
} = globalThis;

const instrument = (options) =>
  generate(
    visit(
      parse(options.file.content, {
        ecmaVersion: 2021,
        sourceType: options.type,
        locations: true,
        allowAwaitOutsideFunction: options.type === "module",
      }),
      {
        url: options.file.url,
        apply: "APPLY",
        eval: { hidden: "EVAL", aliases: ["eval"] },
        mapping: createMirrorSourceMap(options.file),
        whitelist: new Set(options.instrumented ? [options.file.url] : []),
        counter: createCounter(0),
      },
    ),
  );

const makeCodeLocation = ({ url, content }, line, column) =>
  stringifyJSON(
    stringifyLocation({ url, hash: hashFile({ url, content }), line, column }),
  );

// expression body //
{
  const file = {
    url: "protocol://host/script.js",
    content: "(() => 123);",
  };
  assertEqual(
    instrument({
      file,
      type: "script",
      instrumented: true,
    }),
    normalize(
      `
        (() => {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RETURN,
            APPLY_RETURNED = true;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(file, 1, 1)},
            APPLY.empty,
            [],
          );
          try {
            return APPLY_RETURN = 123;
          } catch (APPLY_ERROR) {
            APPLY_RETURNED = false;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(file, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(file, 1, 1)},
                APPLY_RETURN,
              );
            }
          }
        });
      `,
      "script",
    ),
  );
}

// subclass //
{
  const file = {
    url: "protocol://host/script.js",
    content: "(class C extends D {\nconstructor () { 123; } })",
  };
  assertEqual(
    instrument({
      file,
      type: "script",
      instrumented: true,
    }),
    normalize(
      `
        (class C extends D { constructor () {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RETURN,
            APPLY_RETURNED = true;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(file, 2, 12)},
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
              ${makeCodeLocation(file, 2, 12)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(file, 2, 12)},
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
}

// parameters && return //
{
  const file = {
    url: "protocol://host/script.js",
    content: "((x, y = 123, ...rest) => { return 456; });",
  };
  assertEqual(
    instrument({
      file,
      type: "script",
      instrumented: true,
    }),
    normalize(
      `
        ((APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, ...APPLY_ARGUMENT_2) => {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RETURN,
            APPLY_RETURNED = true;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(file, 1, 1)},
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
              ${makeCodeLocation(file, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(file, 1, 1)},
                APPLY_RETURN,
              );
            }
          }
        });
      `,
      "script",
    ),
  );
}

// generator //
{
  const file = {
    url: "protocol://host/script.js",
    content: "(function* () { yield* 123; });",
  };
  assertEqual(
    instrument({
      file,
      type: "script",
      instrumented: true,
    }),
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
            ${makeCodeLocation(file, 1, 1)},
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
              ${makeCodeLocation(file, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(file, 1, 1)},
                APPLY_RETURN,
              );
            }
          }
        });
      `,
      "script",
    ),
  );
}

// asynchronous //
{
  const file = {
    url: "protocol://host/script.js",
    content: `(async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });`,
  };
  assertEqual(
    instrument({
      file,
      type: "script",
      instrumented: true,
    }),
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
            ${makeCodeLocation(file, 1, 1)},
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
              ${makeCodeLocation(file, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(file, 1, 1)},
                APPLY_RETURN,
              );
            }
          }
        });
      `,
      "script",
    ),
  );
}

// not instrumented //
assertEqual(
  instrument({
    file: {
      url: "protocol://host/script.js",
      content: `
        (async function* () {
          await 'promise';
          yield 'iterator';
          try { 123; } finally { 456; }
          return 123;
        });
      `,
    },
    type: "script",
    instrumented: false,
  }),
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
  instrument({
    file: {
      url: "protocol://host/script.js",
      content: "try { 123; } catch { 456; }",
    },
    type: "module",
    instrumented: true,
  }),
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
  instrument({
    file: {
      url: "protocol://host/script.js",
      content: "try { 123; } finally { 456; }",
    },
    type: "module",
    instrumented: true,
  }),
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
  instrument({
    file: {
      url: "protocol://host/script.js#hash",
      content: "f();",
    },
    type: "script",
    instrumented: false,
  }),
  normalize("f()", "script"),
);

// CallExpression >> eval //
assertEqual(
  instrument({
    file: {
      url: "protocol://host/script.js",
      content: "eval(123, 456);",
    },
    type: "script",
    instrumented: false,
  }),
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
