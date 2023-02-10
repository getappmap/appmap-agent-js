import { createHash } from "node:crypto";

const { String } = globalThis;

export const hashStringArray = (strings) => {
  const hash = createHash("sha256");
  for (const string of strings) {
    hash.update(`${String(string.length)}|`, "utf8");
    hash.update(string, "utf8");
  }
  return hash.digest("base64");
};
