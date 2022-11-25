const {
  process: { argv, cwd },
} = globalThis;

import "./error.mjs";
import { loadComponentAsync } from "../load.mjs";

const { main } = await loadComponentAsync("init", { env: "node" });

const root = argv[2] || cwd();

export default main(root);
