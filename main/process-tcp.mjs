
import {buildProdAsync} from "../build/index.mjs";

const {main:{main}} = await buildProdAsync(["main"], {
  violation: "exit",
  client: "tcp",
  "hook-module": "node",
  "hook-group": "node",
  "hook-query": "node",
  main: "process",
});

export const {transformSource} = main(process);
