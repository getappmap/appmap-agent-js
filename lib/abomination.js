// This abomination solves the empty file extension issue caused by --experimental-loader.
// Indeed, this flag (seems to) cause the default loader to go from cjs to esm.
// And file without extension works fine with the cjs loader but not with the esm loader.

const { copyFileSync, readlinkSync, symlinkSync, unlinkSync } = require("fs");
const { dirname, extname, resolve } = require("path");

const { stringify } = JSON;

const { argv, stdout } = process;
const link = argv[1];

let path;
try {
  path = readlinkSync(link);
} catch (error) {
  path = null;
}

if (path !== null) {
  const extension = extname(path);
  if (extension === "") {
    stdout.write(
      `[AppmapAgent] Symbolic link ${stringify(link)} refers to ${stringify(
        path,
      )} which has no extension, this is problematic for the node's esm loader which is enabled by --experimental-loader. To solve this issue, the agent is going to create copy of that file with a '.cjs' extension and overwrite the link to refer to that file. We hoop this is okay with you...${"\n"}`,
      "utf8",
    );
    const absolute_path = resolve(dirname(link), path);
    try {
      copyFileSync(absolute_path, `${absolute_path}.cjs`);
      unlinkSync(link);
      symlinkSync(`${path}.cjs`, link);
    } catch ({ message }) {
      stdout.write(
        `[AppmapAgent] Something went wrong wen resolving the missing file extension issue: ${message}${"\n"}`,
        "utf8",
      );
    }
  }
}
