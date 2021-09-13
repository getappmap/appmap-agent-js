import * as Array from "./array.mjs";
import * as Assert from "./assert.mjs";
import * as Box from "./box.mjs";
import * as Emitter from "./emitter.mjs";
import * as Counter from "./counter.mjs";
import * as Format from "./format.mjs";
import * as Function from "./function.mjs";
import * as Object from "./object.mjs";
import * as Path from "./path.mjs";
import * as Print from "./print.mjs";
import * as Version from "./version.mjs";

export default (dependencies) => {
  return {
    ...Array,
    ...Assert,
    ...Box,
    ...Counter,
    ...Emitter,
    ...Format,
    ...Function,
    ...Object,
    ...Path,
    ...Print,
    ...Version,
  };
};
