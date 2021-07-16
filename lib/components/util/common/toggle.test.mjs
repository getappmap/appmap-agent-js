import { strict as Assert } from "assert";
import { createToggle, isToggleReversed, flipToggle } from "./toggle.mjs";

const toggle = createToggle();
Assert.equal(isToggleReversed(toggle), false);
Assert.equal(flipToggle(toggle), undefined);
Assert.equal(isToggleReversed(toggle), true);
