
import {buildProdAsync} from "../build/index.mjs";

const {main:{main}} = await buildProdAsync(["main"], {
  client: "tcp",
  "hook-module": "node",
  "hook-group": "node",
  main: "node",
});

export const {transformSource} = main(process);
