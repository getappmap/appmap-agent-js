import { assertDeepEqual } from "../../__fixture__.mjs";
import { parseExceptionStack } from "./index.mjs";

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
    },
    {
      level: 1,
      method: "extendConfigurationNode",
      fileName:
        "/Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs",
      line: 5588,
    },
    {
      level: 2,
      method: "record",
      fileName:
        "/Users/user/dev/appland/appmap-agent-js/dist/bundles/recorder-process.mjs",
      line: 5609,
    },
    {
      level: 3,
      method: "",
      fileName: "/Users/user/dev/appland/appmap-agent-js/lib/node/recorder.mjs",
      line: 11,
    },
    {
      level: 4,
      method: "ModuleJob.run",
      fileName: "node:internal/modules/esm/module_job",
      line: 183,
    },
    {
      level: 5,
      method: "<anonymous>",
      fileName: "<anonymous>",
      line: 1,
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
