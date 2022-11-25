const {
  process: { argv, cwd },
} = globalThis;

import { loadComponentAsync } from "../load.mjs";
import "./error.mjs";

const { main } = await loadComponentAsync("init", { env: "node" });

const root = argv[2] || cwd();

export default main(root);
