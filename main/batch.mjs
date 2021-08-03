
import minimist from "minimist"
import {buildProdAsync} from "../build/index.mjs";

const {main:{main}} = await buildProdAsync(["main"], {
  violation: "error",
  server: "tcp",
  main: "batch",
});

main(process);
