import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Grouping from "./index.mjs";

const { ok: assert, equal: assertEqual, notEqual: assertNotEqual } = Assert;

const testAsync = async () => {
  const dependencies = await buildAsync({ util: "default" });
  const {
    util: { consumeStreamAsync },
  } = dependencies;
  const {
    initializeGrouping,
    getCurrentGroup,
    getGroupStream,
    terminateGrouping,
  } = Grouping(dependencies);
  const grouping = initializeGrouping({});
  const group1 = getCurrentGroup(grouping);
  assertEqual(typeof group1, "number");
  assertEqual(group1, getCurrentGroup(grouping));
  await Promise.resolve();
  terminateGrouping(grouping);
  const group2 = getCurrentGroup(grouping);
  assertEqual(typeof group2, "number");
  assertEqual(group2, getCurrentGroup(grouping));
  assertNotEqual(group2, group1);
  const buffer = [];
  await consumeStreamAsync(getGroupStream(grouping), (element) => {
    buffer.push(element);
  });
  assert(buffer.length > 0);
};

testAsync();
