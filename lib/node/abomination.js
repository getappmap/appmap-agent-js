const Module = require("module");
const { copyFileSync, readFileSync, realpathSync } = require("fs");
const {
  extname: getExtension,
  dirname: getDirectory,
  basename: getBasename,
  join: joinPath,
} = require("path");

// https://github.com/nodejs/node/blob/2cc7a91a5d855b4ff78f21f1bb8d4e55131d0615/lib/internal/modules/run_main.js

const { runMain } = Module;

const readFileMaybe = (path) => {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    } else {
      throw error;
    }
  }
};

Module.runMain = function executeUserEntryPoint(main = process.argv[1]) {
  // TODO this prevents the original runMain to suppport --preserve-symlinks-main
  const path = realpathSync(main);
  const directory = getDirectory(path);
  const extension = getExtension(path);
  const basename = getBasename(path, extension);
  if (extension === "" || extension === ".node") {
    const modified_path = joinPath(directory, `${basename}.cjs`);
    const maybe_content = readFileMaybe(modified_path);
    if (maybe_content === null) {
      copyFileSync(path, modified_path);
    } else if (readFileSync(path, "utf8") !== maybe_content) {
      throw new Error(
        "Unable to solve the file extension issue of ESM loader -- see: https://github.com/nodejs/node/issues/41465",
      );
    }
    return runMain(modified_path);
  } else {
    return runMain(path);
  }
};
