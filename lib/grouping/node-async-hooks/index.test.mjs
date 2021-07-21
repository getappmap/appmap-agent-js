import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Grouping from "./index.mjs";

const { equal: assertEqual, notEqual: assertNotEqual } = Assert;

const mainAsync = async () => {
  const { initializeGrouping, getCurrentGroup, terminateGrouping } = Grouping(
    await buildAsync({ util: "default" }),
  );
  const grouping = initializeGrouping({});
  const group1 = getCurrentGroup(grouping);
  assertEqual(typeof group1, "number");
  assertEqual(group1, getCurrentGroup(grouping));
  let resolveTimeout;
  const timeout = new Promise((resolve, reject) => {
    resolveTimeout = resolve;
  });
  setTimeout(() => {
    const { group: group2, description, origin } = getCurrentGroup(grouping);
    assertEqual(typeof group2, "number");
    assertEqual(origin, group1);
    assertEqual(description, "Timeout");
    assertNotEqual(group2, group1);
    assertEqual(group2, getCurrentGroup(grouping));
    resolveTimeout();
  });
  await timeout;
  terminateGrouping(grouping);
};

mainAsync();
