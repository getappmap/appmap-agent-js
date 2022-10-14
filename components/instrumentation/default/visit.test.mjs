import { assertEqual } from "../../__fixture__.mjs";
import {
  makeLocation,
  stringifyLocation,
} from "../../location/index.mjs?env=test";
import { createCounter } from "../../util/index.mjs?env=test";
import { createMirrorSourceMap } from "../../source/index.mjs?env=test";
import { normalize, parse, generate } from "./__fixture__.mjs";
import { visit } from "./visit.mjs?env=test";

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
  stringifyJSON(stringifyLocation(makeLocation(url, line, column)));

// expression body //
assertEqual(
  instrument(
    {
      url: "file:///w:/script.js",
      content: "(() => 123);",
      type: "script",
    },
    ["file:///w:/script.js"],
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
          ${makeCodeLocation("file:///w:/script.js", 1, 1)},
          APPLY.empty,
          [],
        );
        try {
          return APPLY_RETURN = 123;
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("file:///w:/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
      url: "file:///w:/script.js",
      content: "(class C extends D {\nconstructor () { 123; } })",
      type: "script",
    },
    ["file:///w:/script.js"],
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
          ${makeCodeLocation("file:///w:/script.js", 2, 12)},
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
            ${makeCodeLocation("file:///w:/script.js", 2, 12)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("file:///w:/script.js", 2, 12)},
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
      url: "file:///w:/script.js",
      content: "((x, y = 123, ...rest) => { return 456; });",
      type: "script",
    },
    ["file:///w:/script.js"],
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
          ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
            ${makeCodeLocation("file:///w:/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
      url: "file:///w:/script.js",
      content: "(function* () { yield* 123; });",
      type: "script",
    },
    ["file:///w:/script.js"],
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
          ${makeCodeLocation("file:///w:/script.js", 1, 1)},
          this,
          [],
        );
        try {
          {
            (
              APPLY_YIELD = 123,
              APPLY_YIELD_TAB = APPLY.getFreshTab(),
              APPLY.recordYield(APPLY_YIELD_TAB, true, APPLY_YIELD),
              yield* APPLY_YIELD,
              APPLY.recordResume(APPLY_YIELD_TAB),
              void 0
            );
          }
        } catch (APPLY_ERROR) {
          APPLY_RETURNED = false;
          APPLY.recordThrow(
            APPLY_BUNDLE_TAB,
            ${makeCodeLocation("file:///w:/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
      url: "file:///w:/script.js",
      content: `(async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });`,
      type: "script",
    },
    ["file:///w:/script.js"],
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
          ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
            ${makeCodeLocation("file:///w:/script.js", 1, 1)},
            APPLY_ERROR,
          );
          throw APPLY_ERROR;
        } finally {
          if (APPLY_RETURNED) {
            APPLY.recordReturn(
              APPLY_BUNDLE_TAB,
              ${makeCodeLocation("file:///w:/script.js", 1, 1)},
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
      url: "file:///w:/script.js",
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
      url: "file:///w:/script.js",
      content: "try { 123; } catch { 456; }",
      type: "module",
    },
    ["file:///w:/script.js"],
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
      url: "file:///w:/script.js",
      content: "try { 123; } finally { 456; }",
      type: "module",
    },
    ["file:///w:/script.js"],
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
      url: "file:///w:/script.js#hash",
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
      url: "file:///w:/script.js#hash",
      content: "eval(123, 456);",
      type: "script",
    },
    [],
  ),
  normalize(
    `eval(
      EVAL(
        "file:///w:/script.js/eval-1",
        123,
      ),
      456,
    );`,
    "script",
  ),
);

// // asynchronous arrow with expression body //
//
// assertEqual(
//   instrument(
//     {
//       url: "file:///w:/script.js",
//       content: "(async (x, y = null, ...z) => await 123);",
//       type: "script",
//     },
//     ["file:///w:/script.js"],
//   ),
//   normalize(
//     `
//       (async (APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, ...APPLY_ARGUMENT_2) => {
//         var
//           APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
//           APPLY_RETURN,
//           APPLY_RETURNED = true,
//           APPLY_YIELD,
//           APPLY_AWAIT,
//           APPLY_AWAITED = false;
//         APPLY.recordApply(
//           APPLY_BUNDLE_TAB,
//           ${stringifyJSON(
//             stringifyLocation(makeLocation("file:///w:/script.js", 1, 1)),
//           )},
//           APPLY.empty,
//           [APPLY_ARGUMENT_0, APPLY_ARGUMENT_1, APPLY_ARGUMENT_2],
//         );
//         try {
//           var
//             x = APPLY_ARGUMENT_0,
//             y = APPLY_ARGUMENT_1 === void 0 ? null : APPLY_ARGUMENT_1,
//             z = APPLY_ARGUMENT_2;
//           return APPLY_RETURN = (
//             APPLY_AWAIT = 123,
//             APPLY.recordAwait(APPLY_BUNDLE_TAB, APPLY_AWAIT),
//             APPLY_AWAITED = true,
//             APPLY_AWAIT = await APPLY_AWAIT,
//             APPLY_AWAITED = false,
//             APPLY.recordResolve(APPLY_BUNDLE_TAB, APPLY_AWAIT),
//             APPLY_AWAIT
//           );
//         } catch (APPLY_ERROR) {
//           if (APPLY_AWAITED) {
//             APPLY.recordReject(APPLY_BUNDLE_TAB, APPLY_ERROR);
//             APPLY_AWAITED = false;
//           }
//           APPLY_RETURNED = false;
//           APPLY.recordThrow(APPLY_BUNDLE_TAB, APPLY_ERROR);
//           throw APPLY_ERROR;
//         } finally {
//           if (APPLY_RETURNED) {
//             APPLY.recordReturn(APPLY_BUNDLE_TAB, APPLY_RETURN);
//           }
//         }
//       });
//     `,
//     "script",
//   ),
// );
//
// // generator function declaration //
//
// for (const [code1, code2] of [
//   ["", "void 0"],
//   ["123", "123"],
// ]) {
//   assertEqual(
//     instrument(
//       {
//         url: "file:///w:/script.js",
//         content: `function* f () {
//           yield* 123;
//           return ${code1};
//         };`,
//         type: "script",
//       },
//       ["file:///w:/script.js"],
//     ),
//     normalize(
//       `
//       function* f () {
//         var
//           APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
//           APPLY_RETURN,
//           APPLY_RETURNED = true,
//           APPLY_YIELD,
//           APPLY_AWAIT,
//           APPLY_AWAITED = false;
//         APPLY.recordApply(
//           APPLY_BUNDLE_TAB,
//           ${stringifyJSON(
//             stringifyLocation(makeLocation("file:///w:/script.js", 1, 0)),
//           )},
//           this,
//           []
//         )
//         try {
//           (
//             APPLY_YIELD = 123,
//             APPLY.recordYield(APPLY_BUNDLE_TAB, true, APPLY_YIELD),
//             yield* APPLY_YIELD,
//             APPLY.recordResume(APPLY_BUNDLE_TAB),
//             void 0
//           );
//           return APPLY_SUCCESS = ${code2};
//         } catch (APPLY_ERROR) {
//           if (APPLY_AWAITED) {
//             APPLY.recordReject(APPLY_BUNDLE_TAB, APPLY_ERROR);
//           }
//           APPLY_RETURNED = false;
//           APPLY.recordThrow(APPLY_BUNDLE_TAB, APPLY_ERROR);
//           throw APPLY_ERROR;
//         } finally {
//           if (APPLY_RETURNED) {
//             APPLY.recordReturn(APPLY_BUNDLE_TAB, APPLY_FAILURE, APPLY_RETURN);
//           }
//         }
//       };
//     `,
//       "script",
//     ),
//   );
// }
//
// // super constructor should not access this //
//
// assertEqual(
//   instrument(
//     {
//       url: "file:///w:/script.js",
//       content: "class C extends Object {constructor\n() { super(); } }",
//       type: "script",
//     },
//     ["file:///w:/script.js"],
//   ),
//   normalize(
//     `
//       class C extends Object {
//         constructor () {
//           var
//             APPLY_BUNDLE_TAB = APPLY.getFreshTab(),
//             APPLY_RETURN,
//             APPLY_RETURNED = true,
//             APPLY_YIELD,
//             APPLY_AWAIT,
//             APPLY_AWAITED = false;
//           APPLY.recordApply(
//             APPLY_BUNDLE_TAB,
//             ${stringifyJSON(
//               stringifyLocation(makeLocation("file:///w:/script.js", 2, 0)),
//             )},
//             APPLY.empty,
//             [],
//           )
//           try {
//             super();
//           } catch (APPLY_ERROR) {
//             if (APPLY_AWAITED) {
//               APPLY.recordReject(APPLY_BUNDLE_TAB, APPLY_ERROR);
//             }
//             APPLY_RETURNED = false;
//             APPLY.recordThrow(APPLY_BUNDLE_TAB, APPLY_ERROR);
//             throw APPLY_ERROR;
//           } finally {
//             if (APPLY_RETURNED) {
//               APPLY.recordReturn(APPLY_BUNDLE_TAB, APPLY_RETURN);
//             }
//           }
//         }
//       }
//     `,
//   ),
// );
//
// // try statement //
//
// assertEqual(
//   instrument(
//     {
//       url: "file:///w:/script.js",
//       content: `
//         try { } catch (error) { 123; }
//         try { } finally { 123; }
//       `,
//       type: "module",
//     },
//     ["file:///w:/script.js"],
//   ),
//   normalize(
//     `
//       let
//         APPLY_BUNDLE_TAB = APPLY.getFreshTab()
//         APPLY_AWAIT,
//         APPLY_AWAITED = false;
//       try { } catch (APPLY_ERROR) {
//         if (APPLY_AWAITED) {
//           APPLY.recordReject(APPLY_BUNDLE_TAB, APPLY_ERROR);
//           APPLY_AWAITED = false;
//         }
//         let error = APPLY_ERROR;
//         {
//           123;
//         }
//       }
//       try { } catch (APPLY_ERROR) {
//         if (APPLY_AWAITED) {
//           APPLY.recordReject(APPLY_BUNDLE_TAB, APPLY_ERROR);
//           APPLY_AWAITED = false;
//         }
//       } finally {
//         123;
//       }
//     `,
//     "module",
//   ),
// );
//
// assertEqual(
//   instrument(
//     {
//       url: "file:///w:/script.js",
//       content: "function g () { return 123; };",
//       type: "script",
//     },
//     [],
//   ),
//   normalize("function g () { return 123; };", "script"),
// );
//
