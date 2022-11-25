import "./error.mjs";
import { loadComponentAsync } from "../load.mjs";

const { process } = globalThis;

const { mainAsync } = await loadComponentAsync("setup", { env: "node" });

export default mainAsync(process);
