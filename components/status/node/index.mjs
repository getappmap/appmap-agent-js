import { execSync } from "node:child_process";
import os from "node:os";
import { readFile as readFileAsync } from "node:fs/promises";
import semver from "semver";
import { self_directory, self_package } from "../../self/index.mjs";

const {
  URL,
  JSON: { parse: parseJSON, stringify: stringifyJSON },
  Promise,
  process,
} = globalThis;

const schema = parseJSON(
  await readFileAsync(new URL("dist/schema.json", self_directory), "utf8"),
);

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
  const versions = self_package.engines.node;
  if (!semver.satisfies(node_version, versions)) {
    errors.push({
      level: "error",
      message: `Unsupported node version ${node_version}, wanted ${versions}`,
    });
  }

  const mocha_info = externals.lsPackage(root, "mocha");
  const package_json = parseJSON(mocha_info);
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

  return stringifyJSON(result, null, 2);
};

export const main = async (root) => {
  const json = run(root);
  await externals.showResults(json);
  return 0;
};
