import { runInThisContext } from "node:vm";

export const runScript = (content, url) =>
  runInThisContext(content, { filename: url });
