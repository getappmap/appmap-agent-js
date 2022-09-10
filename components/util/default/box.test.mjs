import { assertEqual } from "../../__fixture__.mjs";
import { createBox, getBox, setBox } from "./box.mjs";

const {undefined} = globalThis;

const box = createBox("foo");
assertEqual(getBox(box), "foo");
assertEqual(setBox(box, "bar"), undefined);
assertEqual(getBox(box), "bar");
