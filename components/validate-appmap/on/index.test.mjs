import { assertThrow } from "../../__fixture__.mjs";
import { validateAppmap } from "./index.mjs?env=test";

assertThrow(() => {
  validateAppmap({
    version: "1.6.0",
    metadata: {},
    classMap: [],
    events: [],
  });
}, "InternalAppmapError: Invalid appmap");
