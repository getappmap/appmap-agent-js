import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";

import { splitTokens, sniffTokens } from "./package.mjs";

/////////////////
// unsupported //
/////////////////

// tokens >> regular //
assertEqual(sniffTokens(["exec", "argv"]), false);

// tokens >> empty //
assertEqual(sniffTokens([]), false);

//////////////////////////////////////////////
// node --cpu-prof node_modules/pckg/bin.js //
//////////////////////////////////////////////

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
