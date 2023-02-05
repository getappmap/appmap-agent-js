import { assertThrow, assertDeepEqual } from "../../__fixture__.mjs";
import { stringifyLocation, parseLocation } from "./index.mjs";

const test = (location) => {
  assertDeepEqual(parseLocation(stringifyLocation(location)), location);
};

test({ hash: "hash", url: null, line: 123, column: 456 });

test({ hash: null, url: "protocol://host/path", line: 123, column: 456 });

assertThrow(
  () =>
    stringifyLocation({
      url: null,
      hash: null,
      line: 123,
      column: 456,
    }),
  /^InternalAppmapError/u,
);
