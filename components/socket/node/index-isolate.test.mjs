import { assertThrow, assertEqual } from "../../__fixture__.mjs";
import { generateSocket } from "./index-isolate.mjs";

assertEqual(typeof generateSocket("unix"), "object");
assertEqual(typeof generateSocket("net"), "object");
assertThrow(
  () => generateSocket("foo"),
  /^InternalAppmapError: invalid socket implementation name$/u,
);
