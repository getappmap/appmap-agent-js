import { strict as Assert } from "assert";
import { createBox, getBox, setBox } from "./box.mjs";

const { equal: assertEqual } = Assert;

const box = createBox("foo");
assertEqual(getBox(box), "foo");
assertEqual(setBox(box, "bar"), undefined);
assertEqual(getBox(box), "bar");
