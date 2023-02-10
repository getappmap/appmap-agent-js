import { createHash } from "node:crypto";

export const hashStringArray = (strings) => {
  const hash = createHash("sha256");
  for (const string of strings) {
    hash.update(string, "utf8");
    hash.update("\0", "utf8");
  }
  return hash.digest("base64");
};
