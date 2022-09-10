/* global hidden */
/* eslint local/no-globals: ["error", "globalThis", "hidden"] */

import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import component from "./index.mjs";

const { undefined } = globalThis;

const { runScript } = component(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(runScript("let hidden = 123;", "file:///script.js"), undefined);
assertEqual(hidden, 123);
