import { strict as Assert } from "assert";
import { buildTestDependenciesAsync } from "../../build.mjs";
import Completion from "./completion.mjs";

Error.stackTraceLimit = Infinity;

const {
  deepEqual: assertDeepEqual,
  // throws: assertThrows,
  // equal: assertEqual,
} = Assert;

const dependencies = await buildTestDependenciesAsync(import.meta.url);
const { manufactureCompletion } = Completion(dependencies);

const makeEvent = (type1, type2, index) => ({
  type: type1,
  index,
  time: 0,
  data: {
    type: type2,
  },
});

////////////
// Normal //
////////////

assertDeepEqual(
  manufactureCompletion([
    makeEvent("begin", "bundle", 1),
    makeEvent("before", "jump", 2),
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", 1),
  ]),
  [
    makeEvent("begin", "bundle", 1),
    makeEvent("before", "jump", 2),
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", 1),
  ],
);

///////////////////////////////
// Resolve Synchronous Stack //
///////////////////////////////

assertDeepEqual(manufactureCompletion([makeEvent("begin", "bundle", 1)]), [
  makeEvent("begin", "bundle", 1),
  makeEvent("before", "jump", Number.MAX_SAFE_INTEGER - 1),
  makeEvent("after", "jump", Number.MAX_SAFE_INTEGER - 1),
  makeEvent("end", "bundle", 1),
]);

assertDeepEqual(manufactureCompletion([makeEvent("end", "bundle", 1)]), [
  makeEvent("begin", "bundle", 1),
  makeEvent("before", "jump", Number.MAX_SAFE_INTEGER - 1),
  makeEvent("after", "jump", Number.MAX_SAFE_INTEGER - 1),
  makeEvent("end", "bundle", 1),
]);

///////////////////////////////
// Resolve Asynchronous Jump //
///////////////////////////////

// manufactureAfterJump //
assertDeepEqual(
  manufactureCompletion([
    makeEvent("begin", "bundle", 1),
    makeEvent("before", "jump", 2),
  ]),
  [
    makeEvent("begin", "bundle", 1),
    makeEvent("before", "jump", 2),
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", 1),
  ],
);

// manufactureBeforeJump //
assertDeepEqual(
  manufactureCompletion([
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", 1),
  ]),
  [
    makeEvent("begin", "bundle", 1),
    makeEvent("before", "jump", 2),
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", 1),
  ],
);

// manufactureBundle //
assertDeepEqual(
  manufactureCompletion([
    makeEvent("after", "jump", 1),
    makeEvent("before", "jump", 2),
  ]),
  [
    makeEvent("begin", "bundle", Number.MAX_SAFE_INTEGER - 1),
    makeEvent("before", "jump", 1),
    makeEvent("after", "jump", 1),
    makeEvent("before", "jump", 2),
    makeEvent("after", "jump", 2),
    makeEvent("end", "bundle", Number.MAX_SAFE_INTEGER - 1),
  ],
);
