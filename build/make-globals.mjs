import * as FileSystem from "fs";

FileSystem.writeFileSync(
  "dist/globals.js",
  `export default ${JSON.stringify(FileSystem.readFileSync("lib/client/es2015/script.js", "utf8")
    .match(/let APPMAP_GLOBAL_[A-Z_]+/gu)
    .map((match) => match.substring(18)), null, 2)};`,
  "utf8");
