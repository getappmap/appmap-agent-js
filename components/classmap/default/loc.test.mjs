import { platform } from "node:process";
import { assertDeepEqual } from "../../__fixture__.mjs";
import { stringifyLoc, parseLoc } from "./loc.mjs";

assertDeepEqual(parseLoc(stringifyLoc("file:///w:/path?key=val#hash", 123)), {
  path:
    platform === "win32" ? "w:\\path?key=val#hash" : "/w:/path?key=val#hash",
  lineno: 123,
});

assertDeepEqual(
  parseLoc(stringifyLoc("protocol://host/path?key=val#hash", 123)),
  {
    path: "protocol://host/path?key=val#hash",
    lineno: 123,
  },
);

assertDeepEqual(parseLoc(stringifyLoc("./path?key=val#hash", 123)), {
  path: "./path?key=val#hash",
  lineno: 123,
});
