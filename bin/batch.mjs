#!/usr/bin/env node

import {buildProdAsync} from "../build/index.mjs";

const {main:{mainAsync}} = await buildProdAsync(["main"], {
  violation: "error",
  log: "node",
  server: "tcp",
  main: "batch",
});

mainAsync(process);
