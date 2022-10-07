import { assertDeepEqual, assertEqual } from "../../__fixture__.mjs";
import {
  makeLocation,
  stringifyLocation,
  parseLocation,
  incrementLocationColumn,
  getLocationFileURL,
} from "./index.mjs?env=test";

const location = { url: "file:///main.js", line: 123, column: 456 };

assertDeepEqual(parseLocation(stringifyLocation(location)), location);

assertDeepEqual(
  incrementLocationColumn(location),
  makeLocation("file:///main.js", 123, 457),
);

assertEqual(getLocationFileURL(location), "file:///main.js");
