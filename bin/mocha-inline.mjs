#!/usr/bin/env node

import {buildProdAsync} from "../src/build.mjs";

const {main:{mainAsync}} = await buildProdAsync(["main"], {
  violation: "exit",
  client: "inline",
  "interpretation": "node",
  "instrumentation": "default",
  "hook-module": "node",
  "hook-group": "node",
  "hook-query": "node",
  main: "mocha",
});

export const {mochaHooks} = mainAsync(process);
