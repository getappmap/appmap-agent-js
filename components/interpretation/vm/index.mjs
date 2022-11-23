import { runInThisContext } from "vm";

export const runScript = (content, url) =>
  runInThisContext(content, { filename: url });
