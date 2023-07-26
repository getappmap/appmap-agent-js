import { assertDeepEqual } from "../../__fixture__.mjs";
import {
  reportError,
  InternalAppmapError,
  ExternalAppmapError,
  parseExceptionStack,
} from "./index.mjs";

const { Error } = globalThis;

reportError(new InternalAppmapError("foo"));

reportError(new ExternalAppmapError("bar"));

reportError(new ExternalAppmapError("bar", new Error("test")));

reportError("qux");

{
  const error = {
    stack: `InternalAppmapError: expected at least two argv
    at assert (file:///Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs:191:11)
    at extendConfigurationNode (file:///Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs:5588:3)
    at record (file:///Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs:5609:19)
    at file:///Users/user/dev/appland/appmap-agent-js/lib/node/recorder.mjs:11:1
    at ModuleJob.run (node:internal/modules/esm/module_job:183:25)
    at <anonymous>:1:1`,
    message: "expected at least two argv",
    name: "InternalAppmapError",
  };

  const stack = parseExceptionStack(error);
  assertDeepEqual(stack, [
    {
      level: 0,
      method: "assert",
      fileName:
        "/Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs",
      line: 191,
      column: 11,
    },
    {
      level: 1,
      method: "extendConfigurationNode",
      fileName:
        "/Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs",
      line: 5588,
      column: 3,
    },
    {
      level: 2,
      method: "record",
      fileName:
        "/Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs",
      line: 5609,
      column: 19,
    },
    {
      level: 3,
      method: "",
      fileName: "/Users/user/dev/appland/appmap-agent-js/lib/node/recorder.mjs",
      line: 11,
      column: 1,
    },
    {
      level: 4,
      method: "ModuleJob.run",
      fileName: "node:internal/modules/esm/module_job",
      line: 183,
      column: 25,
    },
    {
      level: 5,
      method: "",
      fileName: "<anonymous>",
      line: 1,
      column: 1,
    },
  ]);
}

{
  // Unknown stack trace formats are ignored
  const error = {
    stack: `Error: something went wrong
    at Class.method ()`,
    message: "something went wrong",
    name: "Error",
  };

  const stack = parseExceptionStack(error);
  assertDeepEqual(stack, []);
}

{
  // Empty stacks return an empty array
  const error = {
    stack: null,
    message: "something went wrong",
    name: "Error",
  };

  const stack = parseExceptionStack(error);
  assertDeepEqual(stack, []);
}

const stack = (...frames) =>
  frames.map(([fileName, level, line, column, method]) => ({
    fileName,
    level,
    line,
    column,
    method,
  }));

assertDeepEqual(
  parseExceptionStack({
    stack: `Error: Things keep happening!
  at /home/gbusey/file.js:525:2
  at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
  at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
  at increaseSynergy (/home/gbusey/actors.js:701:6)`,
  }),
  stack(
    ["/home/gbusey/file.js", 0, 525, 2, ""],
    ["/home/gbusey/business-logic.js", 1, 424, 21, "Frobnicator.refrobulate"],
    ["/home/gbusey/actors.js", 2, 400, 8, "Actor.<anonymous>"],
    ["/home/gbusey/actors.js", 3, 701, 6, "increaseSynergy"],
  ),
);

assertDeepEqual(
  parseExceptionStack({
    stack: `Error: Things keep happening!
  at foobar
  at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
  at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
  at increaseSynergy (/home/gbusey/actors.js:701:6)`,
  }),
  stack(
    ["/home/gbusey/business-logic.js", 1, 424, 21, "Frobnicator.refrobulate"],
    ["/home/gbusey/actors.js", 2, 400, 8, "Actor.<anonymous>"],
    ["/home/gbusey/actors.js", 3, 701, 6, "increaseSynergy"],
  ),
);

assertDeepEqual(
  parseExceptionStack({
    stack: `Error: Things keep happening!
  at native
  at /home/gbusey/file.js:525:2
  at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
  at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
  at increaseSynergy (/home/gbusey/actors.js:701:6)`,
  }),
  stack(
    ["native", 0, 0, 0, ""],
    ["/home/gbusey/file.js", 1, 525, 2, ""],
    ["/home/gbusey/business-logic.js", 2, 424, 21, "Frobnicator.refrobulate"],
    ["/home/gbusey/actors.js", 3, 400, 8, "Actor.<anonymous>"],
    ["/home/gbusey/actors.js", 4, 701, 6, "increaseSynergy"],
  ),
);

assertDeepEqual(
  parseExceptionStack({
    stack: `Error: Things keep happening!
  at Function.Module._load (module.js:312:12)
  at native
  at /home/gbusey/file.js:525:2
  at Frobnicator.refrobulate (/home/gbusey/business-logic.js:424:21)
  at Actor.<anonymous> (/home/gbusey/actors.js:400:8)
  at increaseSynergy (/home/gbusey/actors.js:701:6)`,
  }),
  stack(
    ["module.js", 0, 312, 12, "Function.Module._load"],
    ["native", 1, 0, 0, ""],
    ["/home/gbusey/file.js", 2, 525, 2, ""],
    ["/home/gbusey/business-logic.js", 3, 424, 21, "Frobnicator.refrobulate"],
    ["/home/gbusey/actors.js", 4, 400, 8, "Actor.<anonymous>"],
    ["/home/gbusey/actors.js", 5, 701, 6, "increaseSynergy"],
  ),
);

assertDeepEqual(
  parseExceptionStack({
    stack: `Error: oh no!
  at speedy (/home/gbusey/file.js:6:11)
  at makeFaster (/home/gbusey/file.js:5:3)
  at Object.<anonymous> (/home/gbusey/file.js:10:1)
  at Module._compile (module.js:456:26)
  at Object.Module._extensions..js (module.js:474:10)
  at Module.load (module.js:356:32)
  at Function.Module._load (module.js:312:12)
  at Function.Module.runMain (module.js:497:10)
  at startup (node.js:119:16)
  at node.js:906:3`,
  }),
  stack(
    ["/home/gbusey/file.js", 0, 6, 11, "speedy"],
    ["/home/gbusey/file.js", 1, 5, 3, "makeFaster"],
    ["/home/gbusey/file.js", 2, 10, 1, "Object.<anonymous>"],
    ["module.js", 3, 456, 26, "Module._compile"],
    ["module.js", 4, 474, 10, "Object.Module._extensions..js"],
    ["module.js", 5, 356, 32, "Module.load"],
    ["module.js", 6, 312, 12, "Function.Module._load"],
    ["module.js", 7, 497, 10, "Function.Module.runMain"],
    ["node.js", 8, 119, 16, "startup"],
    ["node.js", 9, 906, 3, ""],
  ),
);
