import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import { getUrlFilename } from "../../url/index.mjs";
import { parseEstree } from "../../parse/index.mjs";
import { digest } from "../../hash/index.mjs";
import { normalize, generate } from "./__fixture__.mjs";
import { createCodebase } from "./codebase.mjs";
import { visit } from "./visit.mjs";

const {
  Map,
  JSON: { stringify: stringifyJSON },
} = globalThis;

const instrument = (options) =>
  generate(
    visit(parseEstree(options.source, { source: null, plugins: null }), {
      url: options.source.url,
      apply: "APPLY",
      eval: { hidden: "EVAL", aliases: ["eval"] },
      codebase: createCodebase(
        options.source.url,
        new Map([[options.source.url, options.source.content]]),
        extendConfiguration(
          createConfiguration("protocol://host/home/"),
          {
            packages: [
              {
                path: getUrlFilename(options.source.url),
                enabled: options.instrumented,
              },
            ],
          },
          options.source.url,
        ),
      ),
    }),
  );

const makeCodeLocation = ({ url, content }, line, column) =>
  stringifyJSON(
    stringifyLocation({
      url,
      hash: digest(content),
      position: { line, column },
    }),
  );

// expression body //
{
  const source = { url: "protocol://host/script.js", content: "(() => 123);" };
  assertEqual(
    instrument({
      source,
      instrumented: true,
    }),
    normalize(
      `
        (() => {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RESULT,
            APPLY_DONE = false;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 1, 1)},
            APPLY.empty,
            [],
          );
          try {
            return APPLY_RESULT = 123;
          } catch (APPLY_ERROR) {
            APPLY_DONE = true;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (!APPLY_DONE) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
                APPLY_RESULT,
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
  const source = {
    url: "protocol://host/script.js",
    content: "(class C extends D {\nconstructor () { 123; } })",
  };
  assertEqual(
    instrument({
      source,
      instrumented: true,
    }),
    normalize(
      `
        (class C extends D { constructor () {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RESULT,
            APPLY_DONE = false;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 2, 12)},
            APPLY.empty,
            [],
          );
          try {
            {
              123;
            }
          } catch (APPLY_ERROR) {
            APPLY_DONE = true;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 2, 12)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (!APPLY_DONE) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 2, 12)},
                APPLY_RESULT,
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
  const source = {
    url: "protocol://host/script.js",
    content: "((x, y = 123, ...rest) => { return 456; });",
  };
  assertEqual(
    instrument({
      source,
      instrumented: true,
    }),
    normalize(
      `
        ((APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, ...APPLY_ARGUMENT_2) => {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RESULT,
            APPLY_DONE = false;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 1, 1)},
            APPLY.empty,
            [APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, APPLY_ARGUMENT_2],
          );
          try {
            var
              x = APPLY_ARGUMENT_0,
              y = APPLY_ARGUMENT_1 === void 0 ? 123 : APPLY_ARGUMENT_1,
              rest = APPLY_ARGUMENT_2;
            {
              return APPLY_RESULT = 456;
            }
          } catch (APPLY_ERROR) {
            APPLY_DONE = true;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (!APPLY_DONE) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
                APPLY_RESULT,
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
  const source = {
    url: "protocol://host/script.js",
    content: "(function* () { yield* 123; });",
  };
  assertEqual(
    instrument({
      source,
      instrumented: true,
    }),
    normalize(
      `
        (function* () {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RESULT,
            APPLY_DONE = false,
            APPLY_JUMP,
            APPLY_JUMP_TAB = null;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 1, 1)},
            this,
            [],
          );
          try {
            {
              (
                APPLY_JUMP = 123,
                (
                  APPLY_JUMP_TAB === null ||
                  APPLY_APPMAP_JUMP_ASSERTION_VIOLATION
                ),
                APPLY_JUMP_TAB = APPLY.getFreshTab(),
                APPLY.recordYield(APPLY_JUMP_TAB, true, APPLY_JUMP),
                APPLY_JUMP = yield* APPLY_JUMP,
                APPLY.recordResolve(APPLY_JUMP_TAB, APPLY_JUMP),
                APPLY_JUMP_TAB = null,
                APPLY_JUMP
              );
            }
          } catch (APPLY_ERROR) {
            if (APPLY_JUMP_TAB !== null) {
              APPLY.recordReject(APPLY_JUMP_TAB, APPLY_ERROR);
              APPLY_JUMP_TAB = null;
            }
            APPLY_DONE = true;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_JUMP_TAB !== null) {
              APPLY.recordResolve(APPLY_JUMP_TAB, APPLY.empty);
              APPLY_JUMP_TAB = null;
            }
            if (!APPLY_DONE) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
                APPLY_RESULT,
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
  const source = {
    url: "protocol://host/script.js",
    content: `
      (async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });
    `,
  };
  assertEqual(
    instrument({
      source,
      instrumented: true,
    }),
    normalize(
      `
        (async () => {
          var
            APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
            APPLY_RESULT,
            APPLY_DONE = false,
            APPLY_JUMP,
            APPLY_JUMP_TAB = null;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 2, 7)},
            APPLY.empty,
            [],
          );
          try {
            {
              try {
                (
                  APPLY_JUMP = 123,
                  (
                    APPLY_JUMP_TAB === null ||
                    APPLY_APPMAP_JUMP_ASSERTION_VIOLATION
                  ),
                  APPLY_JUMP_TAB = APPLY.getFreshTab(),
                  APPLY.recordAwait(APPLY_JUMP_TAB, APPLY_JUMP),
                  APPLY_JUMP = await APPLY_JUMP,
                  APPLY.recordResolve(APPLY_JUMP_TAB, APPLY_JUMP),
                  APPLY_JUMP_TAB = null,
                  APPLY_JUMP
                );
              } catch (APPLY_ERROR) {
                if (APPLY_JUMP_TAB !== null) {
                  APPLY.recordReject(APPLY_JUMP_TAB, APPLY_ERROR);
                  APPLY_JUMP_TAB = null;
                }
                let error = APPLY_ERROR;
                {
                  456;
                }
              } finally {
                if (APPLY_JUMP_TAB !== null) {
                  APPLY.recordResolve(APPLY_JUMP_TAB, APPLY.empty);
                  APPLY_JUMP_TAB = null;
                }
                {
                  789;
                }
              }
            }
          } catch (APPLY_ERROR) {
            if (APPLY_JUMP_TAB !== null) {
              APPLY.recordReject(APPLY_JUMP_TAB, APPLY_ERROR);
              APPLY_JUMP_TAB = null;
            }
            APPLY_DONE = true;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 2, 7)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_JUMP_TAB !== null) {
              APPLY.recordResolve(APPLY_JUMP_TAB, APPLY.empty);
              APPLY_JUMP_TAB = null;
            }
            if (!APPLY_DONE) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 2, 7)},
                APPLY_RESULT,
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
    source: {
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
    source: {
      url: "protocol://host/script.js",
      content: "try { 123; } catch { 456; } export default 789;",
    },
    instrumented: true,
  }),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_JUMP,
        APPLY_JUMP_TAB = null;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_JUMP_TAB !== null) {
          APPLY.recordReject(APPLY_JUMP_TAB, APPLY_ERROR);
          APPLY_JUMP_TAB = null;
        }
        {
          456;
        }
      } finally {
        if (APPLY_JUMP_TAB !== null) {
          APPLY.recordResolve(APPLY_JUMP_TAB, APPLY.empty);
          APPLY_JUMP_TAB = null;
        }
      }
      export default 789;
    `,
    "module",
  ),
);

// module >> try without catch //
assertEqual(
  instrument({
    source: {
      url: "protocol://host/script.js",
      content: "try { 123; } finally { 456; } export default 789;",
    },
    instrumented: true,
  }),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_JUMP,
        APPLY_JUMP_TAB = null;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_JUMP_TAB !== null) {
          APPLY.recordReject(APPLY_JUMP_TAB, APPLY_ERROR);
          APPLY_JUMP_TAB = null;
        }
      } finally {
        if (APPLY_JUMP_TAB !== null) {
          APPLY.recordResolve(APPLY_JUMP_TAB, APPLY.empty);
          APPLY_JUMP_TAB = null;
        }
        {
          456;
        }
      }
      export default 789;
    `,
    "module",
  ),
);

// CallExpression //
assertEqual(
  instrument({
    source: {
      url: "protocol://host/script.js#hash",
      content: "f();",
    },
    instrumented: false,
  }),
  normalize("f()", "script"),
);

// CallExpression >> eval //
assertEqual(
  instrument({
    source: {
      url: "protocol://host/script.js",
      content: "eval(123, 456);",
    },
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
