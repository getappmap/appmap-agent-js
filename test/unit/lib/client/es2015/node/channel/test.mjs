
import {strict as Assert} from "assert";
import makeChannel from "../../../../../../../lib/client/es2015/node/channel/test.js";

const IDENTIFIER = "__TRACE__";

const channel = makeChannel({APPMAP_TRACE_IDENTIFIER:IDENTIFIER});

channel.initialize("data");
/* eslint-disable no-eval */
global.eval(channel.instrumentScript(`${IDENTIFIER}.push("original-script");`, "filename.js"));
channel.instrumentModule(`${IDENTIFIER}.push("original-module");`, "filename.mjs", {resolve: global.eval});
/* eslint-enable no-eval */
channel.emit("event");
channel.terminate("reason");

Assert.deepEqual(
  global[IDENTIFIER],
  [
    ["initialize", "data"],
    ["instrument-script", "filename.js"],
    ["run-script", "filename.js"],
    "original-script",
    ["instrument-module", "filename.mjs"],
    ["run-module", "filename.mjs"],
    "original-module",
    ["emit", "event"],
    ["terminate", "reason"]
  ]
);
