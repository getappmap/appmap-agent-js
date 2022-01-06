/* global x */
import { assertEqual } from "../../__fixture__.mjs";
import { buildTestDependenciesAsync } from "../../build.mjs";
import component from "./index.mjs";

const { runScript } = component(
  await buildTestDependenciesAsync(import.meta.url),
);
assertEqual(runScript("let x = 123;", "file:///script.js"), undefined);
assertEqual(x, 123);
