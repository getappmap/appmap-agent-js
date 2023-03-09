import { assertEqual } from "../../__fixture__.mjs";
import {
  createConfiguration,
  extendConfiguration,
} from "../../configuration/index.mjs";
import { stringifyLocation } from "../../location/index.mjs";
import { createCounter } from "../../util/index.mjs";
import { getUrlFilename } from "../../url/index.mjs";
import { createMirrorMapping } from "../../mapping/index.mjs";
import {
  createSource,
  makeSourceLocation,
  getSourceUrl,
  parseSource,
} from "../../source/index.mjs";
import { normalize, generate } from "./__fixture__.mjs";
import { createExclusion, addExclusionSource } from "./exclusion.mjs";
import { visit } from "./visit.mjs";

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const instrument = (options) => {
  const exclusion = createExclusion(
    extendConfiguration(
      createConfiguration("protocol://host/home/"),
      {
        packages: [
          {
            path: getUrlFilename(getSourceUrl(options.source)),
            enabled: options.instrumented,
          },
        ],
      },
      getSourceUrl(options.source),
    ),
  );
  addExclusionSource(exclusion, options.source);
  return generate(
    visit(parseSource(options.source), {
      url: getSourceUrl(options.source),
      apply: "APPLY",
      eval: { hidden: "EVAL", aliases: ["eval"] },
      mapping: createMirrorMapping(options.source),
      exclusion,
      counter: createCounter(0),
    }),
  );
};

const makeCodeLocation = (source, line, column) =>
  stringifyJSON(stringifyLocation(makeSourceLocation(source, line, column)));

// expression body //
{
  const source = createSource("protocol://host/script.js", "(() => 123);");
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
            APPLY_RETURN,
            APPLY_RETURNED = true;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 1, 1)},
            APPLY.empty,
            [],
          );
          try {
            return APPLY_RETURN = 123;
          } catch (APPLY_ERROR) {
            APPLY_RETURNED = false;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
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
  const source = createSource(
    "protocol://host/script.js",
    "(class C extends D {\nconstructor () { 123; } })",
  );
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
            APPLY_RETURN,
            APPLY_RETURNED = true;
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
            APPLY_RETURNED = false;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 2, 12)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 2, 12)},
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
  const source = createSource(
    "protocol://host/script.js",
    "((x, y = 123, ...rest) => { return 456; });",
  );
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
            APPLY_RETURN,
            APPLY_RETURNED = true;
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
              return APPLY_RETURN = 456;
            }
          } catch (APPLY_ERROR) {
            APPLY_RETURNED = false;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
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
  const source = createSource(
    "protocol://host/script.js",
    "(function* () { yield* 123; });",
  );
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
            APPLY_RETURN,
            APPLY_RETURNED = true,
            APPLY_YIELD,
            APPLY_YIELD_TAB = null;
          APPLY.recordApply(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation(source, 1, 1)},
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
              ${makeCodeLocation(source, 1, 1)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 1, 1)},
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
  const source = createSource(
    "protocol://host/script.js",
    `
      (async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });
    `,
  );
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
            APPLY_RETURN,
            APPLY_RETURNED = true,
            APPLY_AWAIT,
            APPLY_AWAIT_TAB = null;
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
                  APPLY_AWAIT = 123,
                  APPLY_AWAIT_TAB = APPLY.getFreshTab(),
                  APPLY.recordAwait(APPLY_AWAIT_TAB, APPLY_AWAIT),
                  APPLY_AWAIT = await APPLY_AWAIT,
                  APPLY.recordResolve(APPLY_AWAIT_TAB, APPLY_AWAIT),
                  APPLY_AWAIT_TAB = null,
                  APPLY_AWAIT
                );
              } catch (APPLY_ERROR) {
                if (APPLY_AWAIT_TAB !== null) {
                  APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
                  APPLY_AWAIT_TAB = null;
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
            if (APPLY_AWAIT_TAB !== null) {
              APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
            }
            APPLY_RETURNED = false;
            APPLY.recordThrow(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation(source, 2, 7)},
              APPLY_ERROR,
            );
            throw APPLY_ERROR;
          } finally {
            if (APPLY_RETURNED) {
              APPLY.recordReturn(
                APPLY_BUNDLE_TAB,
                ${makeCodeLocation(source, 2, 7)},
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
    source: createSource(
      "protocol://host/script.js",
      `
        (async function* () {
          await 'promise';
          yield 'iterator';
          try { 123; } finally { 456; }
          return 123;
        });
      `,
    ),
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
    source: createSource(
      "protocol://host/script.js",
      "try { 123; } catch { 456; } export default 789;",
    ),
    instrumented: true,
  }),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_AWAIT,
        APPLY_AWAIT_TAB = null;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_AWAIT_TAB !== null) {
          APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
          APPLY_AWAIT_TAB = null;
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

// module >> try without catch //
assertEqual(
  instrument({
    source: createSource(
      "protocol://host/script.js",
      "try { 123; } finally { 456; } export default 789;",
    ),
    instrumented: true,
  }),
  normalize(
    `
      let
        APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
        APPLY_AWAIT,
        APPLY_AWAIT_TAB = null;
      try {
        123;
      } catch (APPLY_ERROR) {
        if (APPLY_AWAIT_TAB !== null) {
          APPLY.recordReject(APPLY_AWAIT_TAB, APPLY_ERROR);
          APPLY_AWAIT_TAB = null;
        }
      } finally {
        456;
      }
      export default 789;
    `,
    "module",
  ),
);

// CallExpression //
assertEqual(
  instrument({
    source: createSource("protocol://host/script.js#hash", "f();"),
    instrumented: false,
  }),
  normalize("f()", "script"),
);

// CallExpression >> eval //
assertEqual(
  instrument({
    source: createSource("protocol://host/script.js", "eval(123, 456);"),
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
