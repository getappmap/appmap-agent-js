import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  makeLocation,
  stringifyLocation,
  parseLocation,
  incrementLocationColumn,
  getLocationFileUrl,
} from "./index.mjs?env=test";

const location = { url: "file:///w:/main.js", line: 123, column: 456 };

assertDeepEqual(parseLocation(stringifyLocation(location)), location);

assertDeepEqual(
  incrementLocationColumn(location),
  makeLocation("file:///w:/main.js", 123, 457),
);

assertEqual(getLocationFileUrl(location), "file:///w:/main.js");
