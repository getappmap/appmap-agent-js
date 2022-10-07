const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { runInThisContext } from "vm";

export const runScript = (content, url) =>
  runInThisContext(content, { filename: url });
