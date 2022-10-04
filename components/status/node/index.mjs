const { URL } = globalThis;
const { search: __search } = new URL(import.meta.url);

import { execSync } from "child_process";
import os from "os";
import { createRequire } from "module";
import semver from "semver";
const { schema } = await import(`../../../dist/schema.mjs${__search}`);

const { Promise, process, JSON } = globalThis;

/* c8 ignore start */
export const externals = {
  lsPackage(root, pkg) {
    const cwd = process.cwd();
    process.chdir(root);
    try {
      return execSync(`npm ls --json ${pkg}`);
    } catch (e) {
      // npm ls returns non-zero for problems that we don't care about (e.g.
      // "extraneous" packages). Try to carry on.
      return e.stdout.toString();
    } finally {
      process.chdir(cwd);
    }
  },

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

  getPlatform() {
    return os.platform();
  },

  getNodeVersion() {
    return process.versions.node;
  },
};
/* c8 ignore stop */

export const run = (root) => {
  const errors = [];

  const node_version = externals.getNodeVersion();
  const require = createRequire(import.meta.url);
  const versions = require("../../../package.json").engines.node;
  if (!semver.satisfies(node_version, versions)) {
    errors.push({
      level: "error",
      message: `Unsupported node version ${node_version}, wanted ${versions}`,
    });
  }

  const mocha_info = externals.lsPackage(root, "mocha");
  const package_json = JSON.parse(mocha_info);
  // It's possible we'll be run in a pre-14 Node VM, so don't use the
  // optional-chaining operator here.
  const deps = package_json.dependencies;
  const mocha = deps && deps.mocha;
  const mocha_version = mocha && mocha.version;
  if (mocha_version) {
    if (!semver.satisfies(mocha_version, ">= 8")) {
      errors.push({
        level: "error",
        message: `Unsupported mocha version ${mocha_version}`,
      });
    }
  }

  const result = {
    errors,
    schema,
  };

  return JSON.stringify(result, null, 2);
};

export const main = async (root) => {
  const json = run(root);
  await externals.showResults(json);
  return 0;
};
