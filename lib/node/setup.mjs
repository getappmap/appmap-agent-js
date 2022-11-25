const { process } = globalThis;

import "./error.mjs";
import { loadComponentAsync } from "../load.mjs";

const { mainAsync } = await loadComponentAsync("setup", { env: "node" });

export default mainAsync(process);
