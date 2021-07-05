
import {runScript} from "./script.mjs";
import {makeThreading} from "./threading.mjs";
import {hook} = require("./hook/index.mjs");

export const create = (dependencies, options) => ({
  runScript,
  makeThreading,
});
