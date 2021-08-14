/* global APPMAP_TRANSFORM_SOURCE */

import { runInThisContext } from "vm";
runInThisContext("let APPMAP_TRANSFORM_SOURCE = null;");

export const transformSource = (content, context, transformSource) => {
  if (APPMAP_TRANSFORM_SOURCE !== null) {
    return APPMAP_TRANSFORM_SOURCE(content, context, transformSource);
  }
  return transformSource(content, context, transformSource);
};

// This abomination solves the empty file extension issue caused by --experimental-loader.
// Indeed, this flag (seems to) cause the default loader to go from cjs to esm.
// And file without extension works fine with the cjs loader but not with the esm loader.
// Hoopfully we should never have to use it...
//
// import { copyFile, readlink, symlink, unlink } from "fs/promises";
// import { dirname, extname, resolve } from "path";
//
// const { argv } = process;
// const link = argv[1];
//
// let relative_path = null;
//
// try {
//   relative_path = await readlink(link);
// } catch (error) {}
//
// console.log("BOUDA", link, relative_path);
//
// if (relative_path !== null) {
//   console.log("yo1");
//   if (extname(relative_path) === "") {
//     console.log("yo2");
//     const absolute_path = resolve(dirname(link), relative_path);
//     await copyFile(absolute_path, `${absolute_path}.js`);
//     await unlink(link);
//     await symlink(`${relative_path}.js`, link);
//   }
// }
