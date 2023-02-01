import { createHash } from "node:crypto";

export const hashFile = ({ url, content }) => {
  const hash = createHash("sha256");
  hash.update(url, "utf8");
  hash.update("\0", "utf8");
  hash.update(content, "utf8");
  return hash.digest("base64");
};
