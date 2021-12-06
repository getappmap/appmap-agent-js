import { execSync } from "child_process";
import os from "os";
import semver from "semver";
import { schema } from "../../../dist/schema.mjs";

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

  async showResults(s) {
    return new Promise((resolve) => {
      process.stdout.end(s, () => resolve());
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

export default (dependencies) => {
  const run = (root) => {
    const errors = [];
    if (externals.getPlatform() === "win32") {
      errors.push({
        level: "error",
        message: "Windows is not currently supported",
      });
    }

    const node_version = externals.getNodeVersion();
    if (!semver.satisfies(node_version, "14.x || 16.x || 17.x")) {
      errors.push({
        level: "error",
        message: `Unsupported node version ${node_version}`,
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

  return {
    run,

    main: async (root) => {
      const json = run(root);
      await externals.showResults(json);
      return true;
    },
  };
};