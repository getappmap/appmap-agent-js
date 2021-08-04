
import {buildProdAsync} from "../build/index.mjs";

const {main:{main}} = await buildProdAsync(["main"], {
  violation: "exit",
  client: "inline",
  "hook-module": "node",
  "hook-group": "node",
  "hook-query": "node",
  main: "process",
});

export const {transformSource} = main(process);
