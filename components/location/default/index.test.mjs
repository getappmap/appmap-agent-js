import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Location from "./index.mjs";

const { deepEqual: assertDeepEqual, equal: assertEqual } = Assert;

const {
  makeLocation,
  stringifyLocation,
  parseLocation,
  incrementLocationColumn,
  getLocationFileURL,
} = Location(await buildTestDependenciesAsync(import.meta.url));

const location = { url: "file:///main.js", line: 123, column: 456 };

assertDeepEqual(parseLocation(stringifyLocation(location)), location);

assertDeepEqual(
  incrementLocationColumn(location),
  makeLocation("file:///main.js", 123, 457),
);

assertEqual(getLocationFileURL(location), "file:///main.js");