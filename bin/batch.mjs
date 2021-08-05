#!/bin/env node

import {buildProdAsync} from "../src/build.mjs";

const {main:{mainAsync}} = await buildProdAsync(["main"], {
  violation: "error",
  log: "debug",
  server: "tcp",
  main: "batch",
});

mainAsync(process);
