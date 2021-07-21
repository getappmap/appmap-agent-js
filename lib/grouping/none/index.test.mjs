import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Grouping from "./index.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { initializeGrouping, getCurrentGroup, terminateGrouping } = Grouping(
    await buildAsync({ util: "default" }),
  );
  const grouping = initializeGrouping({});
  assertEqual(typeof getCurrentGroup(grouping), "number");
  terminateGrouping(grouping);
};

mainAsync();
