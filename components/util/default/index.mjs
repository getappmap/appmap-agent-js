import * as Array from "./array.mjs";
import * as Assert from "./assert.mjs";
import * as Box from "./box.mjs";
import * as Counter from "./counter.mjs";
import * as Either from "./either.mjs";
import * as Format from "./format.mjs";
import * as Function from "./function.mjs";
import * as Maybe from "./maybe.mjs";
import * as Object from "./object.mjs";
import * as Print from "./print.mjs";
import * as Version from "./version.mjs";

export default (_dependencies) => ({
  ...Array,
  ...Assert,
  ...Box,
  ...Counter,
  ...Either,
  ...Format,
  ...Function,
  ...Object,
  ...Maybe,
  ...Print,
  ...Version,
});
