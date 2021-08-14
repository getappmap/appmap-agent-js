// This abomination solves the empty file extension issue caused by --experimental-loader.
// Indeed, this flag (seems to) cause the default loader to go from cjs to esm.
// And file without extension works fine with the cjs loader but not with the esm loader.

const { copyFileSync, readlinkSync, symlinkSync, unlinkSync } = require("fs");
const { dirname, extname, resolve } = require("path");

const { argv } = process;
const link = argv[1];
const relative_path = readlinkSync(link);
const extension = extname(relative_path);

if (extension === "") {
  const absolute_path = resolve(dirname(link), relative_path);
  copyFileSync(absolute_path, `${absolute_path}.js`);
  unlinkSync(link);
  symlinkSync(`${relative_path}.js`, link);
}
