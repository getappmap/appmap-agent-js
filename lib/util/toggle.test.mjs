import { strict as Assert } from "assert";
import {
  createToggle,
  isToggleOn,
  isToggleOff,
  setToggleOn,
  setToggleOff,
} from "./toggle.mjs";

const toggle = createToggle();
Assert.equal(setToggleOn(toggle), undefined);
Assert.equal(isToggleOn(toggle), true);
Assert.equal(isToggleOff(toggle), false);
Assert.equal(setToggleOff(toggle), undefined);
Assert.equal(isToggleOn(toggle), false);
Assert.equal(isToggleOff(toggle), true);
