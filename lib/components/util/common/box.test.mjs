import { strict as Assert } from "assert";
import { createBox, getBox, setBox } from "./box.mjs";

const box = createBox("foo");
Assert.equal(getBox(box), "foo");
Assert.equal(setBox(box, "bar"), undefined);
Assert.equal(getBox(box), "bar");
