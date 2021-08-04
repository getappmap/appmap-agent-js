
import {buildProdAsync} from "../build/index.mjs";

const {main:{mainAsync}} = await buildProdAsync(["main"], {
  violation: "error",
  log: "info",
  server: "tcp",
  main: "batch",
});

mainAsync(process);
