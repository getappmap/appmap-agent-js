const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

export { executionAsyncId as getCurrentGroup } from "async_hooks";
