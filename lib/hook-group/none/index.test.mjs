import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Grouping from "./index.mjs";

const { equal: assertEqual, fail } = Assert;

const mainAsync = async () => {
  const dependencies = await buildAsync({ util: "default" });
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

mainAsync();
