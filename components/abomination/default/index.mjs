const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

// https://github.com/mochajs/mocha/issues/4720

// This abomination solves the empty file extension issue caused by --experimental-loader.
// Indeed, this flag (seems to) cause the default loader to go from cjs to esm.
// And file without extension works fine with the cjs loader but not with the esm loader.

import {
  readlink as readLinkAsync,
  copyFile as copyFileAsync,
  unlink as unlinkAsync,
  symlink as symlinkAsync,
} from "fs/promises";
import {
  extname as getExtension,
  dirname as getDirectory,
  resolve as resolvePath,
} from "path";
const { logInfo } = await import(`../../log/index.mjs${__search}`);
const { expectSuccessAsync, expect } = await import(
  `../../expect/index.mjs${__search}`
);

const readMaybeLinkAsync = async (link) => {
  try {
    return await readLinkAsync(link);
  } catch {
    return null;
  }
};

export const addLinkExtensionAsync = async (link) => {
  const path = await readMaybeLinkAsync(link);
  if (path === null) {
    const extension = getExtension(link);
    expect(
      extension !== "",
      "Cannot solve the empty extension issue because %j is not a symbolic link",
      link,
    );
  } else {
    const extension = getExtension(path);
    if (extension === "") {
      logInfo(
        "Symbolic link %j refers to %j which has no extension, this is problematic for the node's esm loader which is enabled by --experimental-loader. To solve this issue, the agent is going to create copy of that file with a '.cjs' extension and overwrite the link to refer to that file. We hope this is okay with you...",
        link,
        path,
      );
      const absolute_path = resolvePath(getDirectory(link), path);
      await expectSuccessAsync(
        (async () => {
          await copyFileAsync(absolute_path, `${absolute_path}.cjs`);
          await unlinkAsync(link);
          await symlinkAsync(`${path}.cjs`, link, "file");
        })(),
        "Something went wrong when resolving the missing file extension issue >> %O",
      );
    }
  }
};
