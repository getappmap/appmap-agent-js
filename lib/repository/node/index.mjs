import { createRequire } from "module";
import { readFileSync, readdirSync } from "fs";
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
    if (
      !assertSuccess(
        () => readdirSync(directory),
        "could not read repository directory %j >> %e",
        directory,
      ).includes("package.json")
    ) {
      logWarning(
        "No 'package.json' file found at repository directory %s",
        directory,
      );
      return null;
    }
    const { name, version, homepage } = {
      name: null,
      version: null,
      homepage: null,
      ...assertSuccess(
        () =>
          parse(
            assertSuccess(
              () => readFileSync(`${directory}/package.json`, "utf8"),
              "could not read 'package.json' file from %j >> %e",
              directory,
            ),
          ),
        "could not parse 'package.json' file from %j >> %e",
        directory,
      ),
    };
    assert(
      name !== null,
      "missing name property in 'package.json' file from %j",
      directory,
    );
    assert(
      version !== null,
      "missing version property in 'package.json' file from %j",
      directory,
    );
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
