import { readFileSync } from "fs";
import { fileURLToPath } from "url";

const { parse: parseJSON } = JSON;

export default (dependencies) => {
  const {
    expect: { expectSuccess },
  } = dependencies;
  return {
    loadSourceMap: (url) => {
      if (url === null || !url.startsWith("file:///")) {
        return null;
      }
      const path = fileURLToPath(url);
      const content = expectSuccess(
        () => readFileSync(path, "utf8"),
        "Failed to read source map at %j >> %e",
        path,
      );
      return expectSuccess(
        () => parseJSON(content),
        "Invalid JSON format for source map at %j >> %e",
        path,
      );
    },
  };
};
