import { strict as Assert } from "assert";
import { buildAsync } from "../../../build/index.mjs";
import Box from "./box.mjs";

const { equal: assertEqual } = Assert;

const mainAsync = async () => {
  const { createBox, getBox, setBox } = Box(
    await buildAsync({
      globals: { LOG_LEVEL: "WARN" },
      violation: "error",
    }),
  );
  const box = createBox("foo");
  assertEqual(getBox(box), "foo");
  assertEqual(setBox(box, "bar"), undefined);
  assertEqual(getBox(box), "bar");
};

mainAsync();
