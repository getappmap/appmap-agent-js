/* globals require: readonly */
/* eslint local/no-globals: ["error", "globalThis", "require"] */

const { renameSync, realpathSync, existsSync, symlinkSync } = require("fs");
const {
  extname: getExtension,
  dirname: getDirectory,
  basename: getBasename,
  join: joinPath,
} = require("path");

const {
  Error,
  process: { argv },
} = globalThis;

// https://github.com/nodejs/node/blob/2cc7a91a5d855b4ff78f21f1bb8d4e55131d0615/lib/internal/modules/run_main.js
// TODO this prevents the original runMain to suppport --preserve-symlinks-main

const path = realpathSync(argv[1]);
const directory = getDirectory(path);
const extension = getExtension(path);
const basename = getBasename(path, extension);
if (extension === "" || extension === ".node") {
  const modified_path = joinPath(directory, `${basename}.cjs`);
  if (existsSync(modified_path)) {
    throw new Error(
      "Unable to solve the file extension issue of ESM loader -- see: https://github.com/nodejs/node/issues/41465",
    );
  }
  renameSync(path, modified_path);
  symlinkSync(modified_path, path, "file");
}
