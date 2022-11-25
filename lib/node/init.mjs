import { loadComponentAsync } from "../load.mjs";
import "./error.mjs";

const {
  process: { argv, cwd },
} = globalThis;

const { main } = await loadComponentAsync("init", { env: "node" });

const root = argv[2] || cwd();

export default main(root);
