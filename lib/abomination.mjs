// This abomination solves the empty file extension issue caused by --experimental-loader.
// Indeed, this flag (seems to) cause the default loader to go from cjs to esm.
// And file without extension works fine with the cjs loader but not with the esm loader.
// Hoopfully we should never have to use it...

import { copyFile, readlink, symlink, unlink } from "fs/promises";
import { dirname, extname, resolve } from "path";

const { argv } = process;
const link = argv[1];
const relative_path = await readlink(link);
const extension = extname(relative_path);

if (extension === "") {
  const absolute_path = resolve(dirname(link), relative_path);
  await copyFile(absolute_path, `${absolute_path}.js`);
  await unlink(link);
  await symlink(`${relative_path}.js`, link);
}
