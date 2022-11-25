import { loadAsync } from "../component/load.mjs";

const { URL } = globalThis;

const home = new URL("../", import.meta.url);

export const loadComponentAsync = (component, params) =>
  loadAsync(home, component, params);
