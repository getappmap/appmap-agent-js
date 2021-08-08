import { strict as Assert } from "assert";
import { buildDependenciesAsync } from "../../build.mjs";
import Box from "./box.mjs";

const { equal: assertEqual } = Assert;

const testAsync = async () => {
  const { createBox, getBox, setBox } = Box(
    await buildDependenciesAsync(import.meta.url, "test"),
  );
  const box = createBox("foo");
  assertEqual(getBox(box), "foo");
  assertEqual(setBox(box, "bar"), undefined);
  assertEqual(getBox(box), "bar");
};

testAsync();
