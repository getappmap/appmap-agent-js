
import {buildProdAsync} from "../build/index.mjs";

const {main:{main}} = await buildProdAsync(["main"], {
  client: "inline",
  "hook-module": "node",
  "hook-group": "node",
  main: "node",
});

export const {transformSource} = main(process);
