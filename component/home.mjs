import { pathToFileURL } from "node:url";
import { cwd } from "node:process";
const { URL } = globalThis;

export const home = new URL(`${pathToFileURL(cwd())}/`);
