import { createHash } from "node:crypto";

export const digest = (string) => {
  const hash = createHash("sha256");
  hash.update(string, "utf8");
  return hash.digest("base64");
};
