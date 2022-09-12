import { assertEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import { normalize, parse, generate } from "./__fixture__.mjs";
import Visit from "./visit.mjs";

const {
  Error,
  JSON: { stringify: stringifyJSON },
  Infinity,
  Set,
} = globalThis;

Error.stackTraceLimit = Infinity;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { visit } = Visit(dependencies);
const { makeLocation, stringifyLocation } = await buildTestComponentAsync(
  "location",
);
const { createCounter } = await buildTestComponentAsync("util");
const { createMirrorSourceMap } = await buildTestComponentAsync("source");

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
        runtime: "$",
        apply: true,
        evals: ["eval"],
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
      url: "file:///script.js",
      content: "(() => 123);",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      (() => {
        var
          $_BUNDLE_TAB = $.getFreshTab(),
          $_RETURN,
          $_RETURNED = true;
        $.recordApply(
          $_BUNDLE_TAB,
          ${makeCodeLocation("file:///script.js", 1, 1)},
          $.empty,
          [],
        );
        try {
          return $_RETURN = 123;
        } catch ($_ERROR) {
          $_RETURNED = false;
          $.recordThrow(
            $_BUNDLE_TAB,
            ${makeCodeLocation("file:///script.js", 1, 1)},
            $_ERROR,
          );
          throw $_ERROR;
        } finally {
          if ($_RETURNED) {
            $.recordReturn(
              $_BUNDLE_TAB,
              ${makeCodeLocation("file:///script.js", 1, 1)},
              $_RETURN,
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
      url: "file:///script.js",
      content: "(class C extends D {\nconstructor () { 123; } })",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      (class C extends D { constructor () {
        var
          $_BUNDLE_TAB = $.getFreshTab(),
          $_RETURN,
          $_RETURNED = true;
        $.recordApply(
          $_BUNDLE_TAB,
          ${makeCodeLocation("file:///script.js", 2, 12)},
          $.empty,
          [],
        );
        try {
          {
            123;
          }
        } catch ($_ERROR) {
          $_RETURNED = false;
          $.recordThrow(
            $_BUNDLE_TAB,
            ${makeCodeLocation("file:///script.js", 2, 12)},
            $_ERROR,
          );
          throw $_ERROR;
        } finally {
          if ($_RETURNED) {
            $.recordReturn(
              $_BUNDLE_TAB,
              ${makeCodeLocation("file:///script.js", 2, 12)},
              $_RETURN,
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
      url: "file:///script.js",
      content: "((x, y = 123, ...rest) => { return 456; });",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      (($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
        var
          $_BUNDLE_TAB = $.getFreshTab(),
          $_RETURN,
          $_RETURNED = true;
        $.recordApply(
          $_BUNDLE_TAB,
          ${makeCodeLocation("file:///script.js", 1, 1)},
          $.empty,
          [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2],
        );
        try {
          var
            x = $_ARGUMENT_0,
            y = $_ARGUMENT_1 === void 0 ? 123 : $_ARGUMENT_1,
            rest = $_ARGUMENT_2;
          {
            return $_RETURN = 456;
          }
        } catch ($_ERROR) {
          $_RETURNED = false;
          $.recordThrow(
            $_BUNDLE_TAB,
            ${makeCodeLocation("file:///script.js", 1, 1)},
            $_ERROR,
          );
          throw $_ERROR;
        } finally {
          if ($_RETURNED) {
            $.recordReturn(
              $_BUNDLE_TAB,
              ${makeCodeLocation("file:///script.js", 1, 1)},
              $_RETURN,
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
      url: "file:///script.js",
      content: "(function* () { yield* 123; });",
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      (function* () {
        var
          $_BUNDLE_TAB = $.getFreshTab(),
          $_RETURN,
          $_RETURNED = true,
          $_YIELD,
          $_YIELD_TAB;
        $.recordApply(
          $_BUNDLE_TAB,
          ${makeCodeLocation("file:///script.js", 1, 1)},
          this,
          [],
        );
        try {
          {
            (
              $_YIELD = 123,
              $_YIELD_TAB = $.getFreshTab(),
              $.recordYield($_YIELD_TAB, true, $_YIELD),
              yield* $_YIELD,
              $.recordResume($_YIELD_TAB),
              void 0
            );
          }
        } catch ($_ERROR) {
          $_RETURNED = false;
          $.recordThrow(
            $_BUNDLE_TAB,
            ${makeCodeLocation("file:///script.js", 1, 1)},
            $_ERROR,
          );
          throw $_ERROR;
        } finally {
          if ($_RETURNED) {
            $.recordReturn(
              $_BUNDLE_TAB,
              ${makeCodeLocation("file:///script.js", 1, 1)},
              $_RETURN,
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
      url: "file:///script.js",
      content: `(async () => {
        try { await 123; }
        catch (error) { 456; }
        finally { 789; }
      });`,
      type: "script",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      (async () => {
        var
          $_BUNDLE_TAB = $.getFreshTab(),
          $_RETURN,
          $_RETURNED = true,
          $_AWAIT,
          $_AWAIT_TAB;
        $.recordApply(
          $_BUNDLE_TAB,
          ${makeCodeLocation("file:///script.js", 1, 1)},
          $.empty,
          [],
        );
        try {
          {
            try {
              (
                $_AWAIT = 123,
                $_AWAIT_TAB = $.getFreshTab(),
                $.recordAwait($_AWAIT_TAB, $_AWAIT),
                $_AWAIT = await $_AWAIT,
                $.recordResolve($_AWAIT_TAB, $_AWAIT),
                $_AWAIT_TAB = void 0,
                $_AWAIT
              );
            } catch ($_ERROR) {
              if ($_AWAIT_TAB !== void 0) {
                $.recordReject($_AWAIT_TAB, $_ERROR);
                $_AWAIT_TAB = void 0;
              }
              let error = $_ERROR;
              {
                456;
              }
            } finally {
              789;
            }
          }
        } catch ($_ERROR) {
          if ($_AWAIT_TAB !== void 0) {
            $.recordReject($_AWAIT_TAB, $_ERROR);
          }
          $_RETURNED = false;
          $.recordThrow(
            $_BUNDLE_TAB,
            ${makeCodeLocation("file:///script.js", 1, 1)},
            $_ERROR,
          );
          throw $_ERROR;
        } finally {
          if ($_RETURNED) {
            $.recordReturn(
              $_BUNDLE_TAB,
              ${makeCodeLocation("file:///script.js", 1, 1)},
              $_RETURN,
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
      url: "file:///script.js",
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
      url: "file:///script.js",
      content: "try { 123; } catch { 456; }",
      type: "module",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      let
        $_BUNDLE_TAB = $.getFreshTab(),
        $_AWAIT,
        $_AWAIT_TAB;
      try {
        123;
      } catch ($_ERROR) {
        if ($_AWAIT_TAB !== void 0) {
          $.recordReject($_AWAIT_TAB, $_ERROR);
          $_AWAIT_TAB = void 0;
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
      url: "file:///script.js",
      content: "try { 123; } finally { 456; }",
      type: "module",
    },
    ["file:///script.js"],
  ),
  normalize(
    `
      let
        $_BUNDLE_TAB = $.getFreshTab(),
        $_AWAIT,
        $_AWAIT_TAB;
      try {
        123;
      } catch ($_ERROR) {
        if ($_AWAIT_TAB !== void 0) {
          $.recordReject($_AWAIT_TAB, $_ERROR);
          $_AWAIT_TAB = void 0;
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
      url: "file:///script.js#hash",
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
      url: "file:///script.js#hash",
      content: "eval(123, 456);",
      type: "script",
    },
    [],
  ),
  normalize(
    `eval(
      APPMAP_HOOK_EVAL(
        "file:///script.js/eval-1#hash",
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
//       url: "file:///script.js",
//       content: "(async (x, y = null, ...z) => await 123);",
//       type: "script",
//     },
//     ["file:///script.js"],
//   ),
//   normalize(
//     `
//       (async ($_ARGUMENT_0, $_ARGUMENT_1, ...$_ARGUMENT_2) => {
//         var
//           $_BUNDLE_TAB = $.getFreshTab(),
//           $_RETURN,
//           $_RETURNED = true,
//           $_YIELD,
//           $_AWAIT,
//           $_AWAITED = false;
//         $.recordApply(
//           $_BUNDLE_TAB,
//           ${stringifyJSON(
//             stringifyLocation(makeLocation("file:///script.js", 1, 1)),
//           )},
//           $.empty,
//           [$_ARGUMENT_0, $_ARGUMENT_1, $_ARGUMENT_2],
//         );
//         try {
//           var
//             x = $_ARGUMENT_0,
//             y = $_ARGUMENT_1 === void 0 ? null : $_ARGUMENT_1,
//             z = $_ARGUMENT_2;
//           return $_RETURN = (
//             $_AWAIT = 123,
//             $.recordAwait($_BUNDLE_TAB, $_AWAIT),
//             $_AWAITED = true,
//             $_AWAIT = await $_AWAIT,
//             $_AWAITED = false,
//             $.recordResolve($_BUNDLE_TAB, $_AWAIT),
//             $_AWAIT
//           );
//         } catch ($_ERROR) {
//           if ($_AWAITED) {
//             $.recordReject($_BUNDLE_TAB, $_ERROR);
//             $_AWAITED = false;
//           }
//           $_RETURNED = false;
//           $.recordThrow($_BUNDLE_TAB, $_ERROR);
//           throw $_ERROR;
//         } finally {
//           if ($_RETURNED) {
//             $.recordReturn($_BUNDLE_TAB, $_RETURN);
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
//         url: "file:///script.js",
//         content: `function* f () {
//           yield* 123;
//           return ${code1};
//         };`,
//         type: "script",
//       },
//       ["file:///script.js"],
//     ),
//     normalize(
//       `
//       function* f () {
//         var
//           $_BUNDLE_TAB = $.getFreshTab(),
//           $_RETURN,
//           $_RETURNED = true,
//           $_YIELD,
//           $_AWAIT,
//           $_AWAITED = false;
//         $.recordApply(
//           $_BUNDLE_TAB,
//           ${stringifyJSON(
//             stringifyLocation(makeLocation("file:///script.js", 1, 0)),
//           )},
//           this,
//           []
//         )
//         try {
//           (
//             $_YIELD = 123,
//             $.recordYield($_BUNDLE_TAB, true, $_YIELD),
//             yield* $_YIELD,
//             $.recordResume($_BUNDLE_TAB),
//             void 0
//           );
//           return $_SUCCESS = ${code2};
//         } catch ($_ERROR) {
//           if ($_AWAITED) {
//             $.recordReject($_BUNDLE_TAB, $_ERROR);
//           }
//           $_RETURNED = false;
//           $.recordThrow($_BUNDLE_TAB, $_ERROR);
//           throw $_ERROR;
//         } finally {
//           if ($_RETURNED) {
//             $.recordReturn($_BUNDLE_TAB, $_FAILURE, $_RETURN);
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
//       url: "file:///script.js",
//       content: "class C extends Object {constructor\n() { super(); } }",
//       type: "script",
//     },
//     ["file:///script.js"],
//   ),
//   normalize(
//     `
//       class C extends Object {
//         constructor () {
//           var
//             $_BUNDLE_TAB = $.getFreshTab(),
//             $_RETURN,
//             $_RETURNED = true,
//             $_YIELD,
//             $_AWAIT,
//             $_AWAITED = false;
//           $.recordApply(
//             $_BUNDLE_TAB,
//             ${stringifyJSON(
//               stringifyLocation(makeLocation("file:///script.js", 2, 0)),
//             )},
//             $.empty,
//             [],
//           )
//           try {
//             super();
//           } catch ($_ERROR) {
//             if ($_AWAITED) {
//               $.recordReject($_BUNDLE_TAB, $_ERROR);
//             }
//             $_RETURNED = false;
//             $.recordThrow($_BUNDLE_TAB, $_ERROR);
//             throw $_ERROR;
//           } finally {
//             if ($_RETURNED) {
//               $.recordReturn($_BUNDLE_TAB, $_RETURN);
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
//       url: "file:///script.js",
//       content: `
//         try { } catch (error) { 123; }
//         try { } finally { 123; }
//       `,
//       type: "module",
//     },
//     ["file:///script.js"],
//   ),
//   normalize(
//     `
//       let
//         $_BUNDLE_TAB = $.getFreshTab()
//         $_AWAIT,
//         $_AWAITED = false;
//       try { } catch ($_ERROR) {
//         if ($_AWAITED) {
//           $.recordReject($_BUNDLE_TAB, $_ERROR);
//           $_AWAITED = false;
//         }
//         let error = $_ERROR;
//         {
//           123;
//         }
//       }
//       try { } catch ($_ERROR) {
//         if ($_AWAITED) {
//           $.recordReject($_BUNDLE_TAB, $_ERROR);
//           $_AWAITED = false;
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
//       url: "file:///script.js",
//       content: "function g () { return 123; };",
//       type: "script",
//     },
//     [],
//   ),
//   normalize("function g () { return 123; };", "script"),
// );
//
