import { strict as Assert } from "assert";
import component from "./index.mjs";

const trace = [];

const { send, close } = component(
  {
    backend: {
      open: () => ({
        close: (...rest) => trace.push("close", ...rest),
        receive: (...rest) => trace.push("receive", ...rest),
      }),
    },
  },
  {},
).open();

send(123);
close();

Assert.deepEqual(trace, ["receive", 123, "close"]);
