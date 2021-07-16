
import * as Assert from "./assert.mjs";
import * as Bind from "./bind.mjs";
import * as Catch from "./catch.mjs";
import * as Compose from "./compose.mjs";
import * as Constant from "./constant.mjs";
import * as Counter from "./counter.mjs";
import * as Deadcode from "./deadcode.mjs";
import * as Format from "./format.mjs";
import * as Identity from "./identity.mjs";
import * as Noop from "./noop.mjs";
import * as Object from "./object.mjs";
import * as Path from "./path.mjs";
import * as Print from "./print.mjs";
import * as Promise from "./promise.mjs";
import * as Specifier from "./specifier.mjs";
import * as Throw from "./throw.mjs";
import * as Toggle from "./toggle.mjs";
import * as Unique from "./unique.mjs";

const Util = {
  __proto__: null,
  ... Assert,
  ... Bind,
  ... Catch,
  ... Compose,
  ... Constant,
  ... Counter,
  ... Deadcode,
  ... Format,
  ... Identity,
  ... Noop,
  ... Object,
  ... Path,
  ... Print,
  ... Promise,
  ... Specifier,
  ... Throw,
  ... Toggle,
  ... Unique,
};

export default (dependencies) => Util;
