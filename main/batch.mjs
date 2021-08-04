
import {buildProdAsync} from "../build/index.mjs";

const {main:{mainAsync}} = await buildProdAsync(["main"], {
  violation: "error",
  log: "debug",
  server: "tcp",
  main: "batch",
});

mainAsync(process);
