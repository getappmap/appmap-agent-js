import * as Assert from "./assert.mjs";
import * as Box from "./box.mjs";
import * as Catch from "./catch.mjs";
import * as Counter from "./counter.mjs";
import * as Deadcode from "./deadcode.mjs";
import * as Format from "./format.mjs";
import * as Function from "./function.mjs";
import * as Object from "./object.mjs";
import * as Path from "./path.mjs";
import * as Print from "./print.mjs";
import * as Promise from "./promise.mjs";
import * as Specifier from "./specifier.mjs";
import * as Throw from "./throw.mjs";
import * as Unique from "./unique.mjs";

const Util = {
  __proto__: null,
  ...Assert,
  ...Box,
  ...Catch,
  ...Counter,
  ...Deadcode,
  ...Format,
  ...Function,
  ...Object,
  ...Path,
  ...Print,
  ...Promise,
  ...Specifier,
  ...Throw,
  ...Unique,
};

export default (dependencies) => Util;