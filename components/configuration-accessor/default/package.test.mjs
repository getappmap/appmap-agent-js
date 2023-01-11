import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";

import {
  splitTokens,
  sniffTokens,
  parseSource,
  sniffSource,
} from "./package.mjs";

/////////////////
// unsupported //
/////////////////

// source >> /bin/sh //
assertEqual(sniffSource("VAR=VAL exec argv", "pckg", "/bin/sh"), false);

// source >> cmd.exe //
assertEqual(sniffSource("exec argv", "pckg", "cmd.exe"), false);

// tokens >> regular //
assertEqual(sniffTokens(["exec", "argv"]), false);

// tokens >> empty //
assertEqual(sniffTokens([]), false);

//////////////////////////////////////////////
// node --cpu-prof node_modules/pckg/bin.js //
//////////////////////////////////////////////

// source >> /bin/sh //
assertEqual(
  sniffSource(
    "VAR=VAL node --cpu-prof node_modules/pckg/bin.js --argv",
    "pckg",
    "/bin/sh",
  ),
  true,
);
assertDeepEqual(
  parseSource(
    "VAR=VAL node --cpu-prof node_modules/pckg/bin.js --argv",
    "/bin/sh",
  ),
  {
    __proto__: null,
    exec: "VAR=VAL node --cpu-prof node_modules/pckg/bin.js",
    argv: "--argv",
  },
);

// source >> cmd.exe //
assertEqual(
  sniffSource(
    "node --cpu-prof node_modules/pckg/bin.js --argv",
    "pckg",
    "cmd.exe",
  ),
  true,
);
assertDeepEqual(
  parseSource("node --cpu-prof node_modules/pckg/bin.js --argv", "cmd.exe"),
  {
    __proto__: null,
    exec: "node --cpu-prof node_modules/pckg/bin.js",
    argv: "--argv",
  },
);

// tokens //
assertEqual(
  sniffTokens(
    ["node", "--cpu-prof", "node_modules/pckg/bin.js", "--argv"],
    "pckg",
  ),
  true,
);
assertDeepEqual(
  splitTokens(["node", "--cpu-prof", "node_modules/pckg/bin.js", "--argv"]),
  {
    __proto__: null,
    exec: ["node", "--cpu-prof", "node_modules/pckg/bin.js"],
    argv: ["--argv"],
  },
);

////////////////////
// node -- --pckg //
////////////////////

assertEqual(sniffTokens(["node", "--", "--pckg", "--argv"], "--pckg"), true);

assertDeepEqual(splitTokens(["node", "--", "--pckg", "--argv"]), {
  __proto__: null,
  exec: ["node", "--", "--pckg"],
  argv: ["--argv"],
});

/////////////
// node -- //
/////////////

assertEqual(sniffTokens(["node", "--"], "pckg"), false);

/////////////////
// node - pckg //
/////////////////

assertEqual(sniffTokens(["node", "-", "pckg"], "--pckg"), false);

/////////////////////
// node --cpu-prof //
/////////////////////

assertEqual(sniffTokens(["node", "--cpu-prof"], "--cpu-prof"), false);
