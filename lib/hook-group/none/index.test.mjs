import { strict as Assert } from "assert";
import { buildTestAsync } from "../../../build/index.mjs";
import Grouping from "./index.mjs";

const { equal: assertEqual, fail } = Assert;

const testAsync = async () => {
  const dependencies = await buildTestAsync(import.meta);
  const {
    util: { consumeStreamAsync },
  } = dependencies;
  const {
    initializeGrouping,
    getCurrentGroup,
    terminateGrouping,
    getGroupStream,
  } = Grouping(dependencies);
  const grouping = initializeGrouping({});
  assertEqual(typeof getCurrentGroup(grouping), "number");
  terminateGrouping(grouping);
  await consumeStreamAsync(getGroupStream(grouping), () => {
    fail();
  });
};

testAsync();
