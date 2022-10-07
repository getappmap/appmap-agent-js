const {
  process: { argv, cwd },
} = globalThis;

import { main } from "../../components/init/index.mjs?env=node";

const root = argv[2] || cwd();

export default main(root);
