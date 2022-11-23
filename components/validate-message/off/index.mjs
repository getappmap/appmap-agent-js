const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export { noop as validateMessage } from "../../util/index.mjs";
