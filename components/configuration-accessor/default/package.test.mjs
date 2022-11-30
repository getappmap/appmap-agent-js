import {
  assertThrow,
  assertEqual,
  assertDeepEqual,
} from "../../__fixture__.mjs";
import { generateParseSource, generateSplitTokens } from "./package.mjs";

const { canParseSource, parseSource } = generateParseSource("mocha");

const { canSplitTokens, splitTokens } = generateSplitTokens("mocha");

/////////////////
// unsupported //
/////////////////

// source //
assertEqual(canParseSource("node main.mjs"), false);
assertThrow(
  () => parseSource("node main.mjs"),
  /^InternalAppmapError: could not parse command source$/u,
);

// tokens //
assertEqual(canSplitTokens(["node", "main.mjs"]), false);
assertThrow(
  () => splitTokens(["node", "main.mjs"]),
  /^InternalAppmapError: could not split command tokens$/u,
);

//////////////////
// mocha --argv //
//////////////////

// source //
assertEqual(canParseSource("mocha --argv"), true);
assertDeepEqual(parseSource("mocha --argv"), {
  __proto__: null,
  before: "mocha",
  after: " --argv",
});

// tokens //
assertEqual(canSplitTokens(["mocha", "--argv"]), true);
assertDeepEqual(splitTokens(["mocha", "--argv"]), {
  __proto__: null,
  before: ["mocha"],
  after: ["--argv"],
});

//////////////////////
// npx mocha --argv //
//////////////////////

// source //
assertEqual(canParseSource("npx mocha --argv"), true);
assertDeepEqual(parseSource("npx mocha --argv"), {
  __proto__: null,
  before: "npx mocha",
  after: " --argv",
});

// tokens //
assertEqual(canSplitTokens(["npx", "mocha", "--argv"]), true);
assertDeepEqual(splitTokens(["npx", "mocha", "--argv"]), {
  __proto__: null,
  before: ["npx", "mocha"],
  after: ["--argv"],
});

///////////////////////////
// npm exec mocha --argv //
///////////////////////////

// source //
assertEqual(canParseSource("npm exec mocha --argv"), true);
assertDeepEqual(parseSource("npm exec mocha --argv"), {
  __proto__: null,
  before: "npm exec mocha",
  after: " --argv",
});

// tokens //
assertEqual(canSplitTokens(["npm", "exec", "mocha", "--argv"]), true);
assertDeepEqual(splitTokens(["npm", "exec", "mocha", "--argv"]), {
  __proto__: null,
  before: ["npm", "exec", "mocha"],
  after: ["--argv"],
});
