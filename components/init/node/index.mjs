const { URL, Promise, process, Set, Array, JSON } = globalThis;

const { search: __search } = new URL(import.meta.url);

import fs from "fs";
import glob from "glob";
import klaw from "klaw-sync";
import { basename as getBasename, join as joinPath } from "path";
import YAML from "yaml";
const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);

// Glob to match/exclude all the directories we should scan for source files:
const GLOB = "!(node_modules)/";

/* c8 ignore start */
export const externals = {
  showResults(s) {
    return new Promise((resolve, reject) => {
      process.stdout.write(s, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
};
const missing_stats = {
  missing: null,
  isDirectory: () => false,
};
const statSyncSafe = (path) => {
  try {
    return fs.statSync(path);
  } catch {
    return missing_stats;
  }
};
/* c8 ignore stop */

const findDirsWithFiles = (root, pattern) => {
  const paths = new Set();
  const hasMatch = (item) => {
    if (hasOwnProperty(item.stats, "missing") || !item.stats.isDirectory()) {
      return false;
    }

    // Don't descend into node_modules
    if (getBasename(item.path) === "node_modules") {
      return true;
    }

    if (
      glob.sync(pattern, { cwd: item.path, strict: false, silent: true })
        .length !== 0
    ) {
      paths.add(item.path);
      return true;
    }
    return false;
  };
  // If there are no matches in the directory, continue scanning the tree.
  const scanIf = (item) => !hasMatch(item);

  // Use GLOB to find directory trees to scan. For each tree, return the
  // shallowest path that contains a match for pattern.
  //
  // Set options to keep glob quiet while scanning so we don't distract the
  // user. (Note that, as described in
  // https://github.com/isaacs/node-glob/issues/298, strict is true by
  // default.)
  const gs = glob.GlobSync(GLOB, { cwd: root, strict: false, silent: true });
  const dirs = gs.found.map((d) => d.slice(0, -1));
  dirs.forEach((dir) => {
    const path = joinPath(root, dir);
    const match_present = hasMatch({
      path,
      stats: statSyncSafe(path),
    });
    if (!match_present) {
      // klaw-sync doesn't provide a way to suppress errors in the same way
      // that GlobSync does. So, arrange for klaw-sync to call GlobSync's
      // implementation of readdir.
      const klaw_fs = {
        ...fs,
        readdirSync: (path, options) => {
          let ret = glob.GlobSync.prototype._readdir.bind(gs)(path, options);
          if (!ret) {
            ret = [];
          }
          return ret;
        },
        statSync: statSyncSafe,
      };

      // Also, klaw-sync calls the filter function before checking if the item is a
      // directory, so there's no point in using its nofile option.
      klaw(path, { fs: klaw_fs, filter: scanIf });
    }
  });

  return paths;
};

export const run = (root) => {
  const dirsWithSrc = findDirsWithFiles(root, "*.map");
  findDirsWithFiles(root, "+(*.[tj]s|*.[cm]js)").forEach((v) =>
    dirsWithSrc.add(v),
  );
  const dirs = Array.from(dirsWithSrc);

  const root_len = root.length;
  const config = {
    name: getBasename(root),
    packages: dirs.map((d) => ({ path: d.substr(root_len + 1) })),
  };
  const result = {
    filename: "appmap.yml",
    configuration: {
      contents: YAML.stringify(config),
    },
  };
  return JSON.stringify(result, null, 2);
};

export const main = async (root) => {
  const json = run(root);
  await externals.showResults(json);
  return 0;
};
