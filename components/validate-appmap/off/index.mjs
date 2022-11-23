const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export { noop as validateAppmap } from "../../util/index.mjs";
