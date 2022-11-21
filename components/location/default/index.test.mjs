import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  makeLocation,
  getLocationPosition,
  getLocationBase,
} from "./index.mjs?env=test";

const base = "protocol://host/path";
const position = { line: 123, column: 456 };
const location = makeLocation(base, position);

assertDeepEqual(getLocationPosition(location), position);

assertEqual(getLocationBase(location), base);
