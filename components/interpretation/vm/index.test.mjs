/* global hidden */
/* eslint local/no-globals: ["error", "globalThis", "hidden"] */

import { assertEqual } from "../../__fixture__.mjs";
import { runScript } from "./index.mjs?env=test";

const { undefined } = globalThis;

assertEqual(runScript("let hidden = 123;", "file:///w:/script.js"), undefined);

assertEqual(hidden, 123);
