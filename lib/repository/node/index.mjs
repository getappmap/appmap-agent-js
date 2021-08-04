import { createRequire } from "module";
import { readFileSync } from "fs";
import Git from "./git.mjs";

const { parse } = JSON;

export default (dependencies) => {
  const {
    assert: { assertSuccess, assert },
    util: { getDirectory },
    log: { logWarning },
  } = dependencies;
  const { extractGitInformation } = Git(dependencies);
  const createPackage = (directory) => {
    let content = "{}";
    try {
      content = readFileSync(`${directory}/package.json`, "utf8");
    } catch (error) {
      const { code } = { code: null, ...error };
      assert(
        code === "ENOENT",
        "failed to read 'package.json' file >> %e",
        error,
      );
      logWarning("No 'package.json' file found at: %s", directory);
    }
    const { name, version, homepage } = {
      name: null,
      version: null,
      homepage: null,
      ...assertSuccess(
        () => parse(content),
        "failed to parse 'package.json' file >> %e",
      ),
    };
    return { name, version, homepage };
  };
  return {
    extractRepositoryHistory: extractGitInformation,
    extractRepositoryPackage: createPackage,
    extractRepositoryDependency: (repository, name) => {
      const { resolve } = createRequire(`${repository}/dummy.js`);
      let path = assertSuccess(
        () => resolve(name),
        "could not resolve %j from %j >> %e",
        name,
        repository,
      );
      path = getDirectory(path);
      while (path !== "/") {
        try {
          readFileSync(`${path}/package.json`, "utf8");
          break;
        } catch (error) {
          const { code } = { code: null, ...error };
          assert(
            code === "ENOENT",
            "failed to attempt reading package.json >> %e",
            error,
          );
        }
        path = getDirectory(path);
      }
      assert(
        path !== "/",
        "failed to find package.json file from module %j in repository %j",
        name,
        repository,
      );
      return {
        directory: path,
        package: createPackage(path),
      };
    },
  };
};
