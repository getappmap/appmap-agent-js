import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { getUuid } from "../../uuid/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { makeLog } from "./index-isolate.mjs";

const { undefined } = globalThis;

assertEqual(makeLog(1).logInfo("stdout"), undefined);

assertEqual(makeLog(2).logInfo("stderr"), undefined);

assertEqual(
  makeLog(toAbsoluteUrl(getUuid(), getTmpUrl())).logInfo("tmp"),
  undefined,
);

assertThrow(() => {
  makeLog(false);
}, /^InternalAppmapError: invalid specifier type for log file$/u);
