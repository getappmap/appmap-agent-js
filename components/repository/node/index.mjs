import { createRequire } from "module";
import { readFileSync, readdirSync } from "fs";
import Git from "./git.mjs";

const { parse } = JSON;

export default (dependencies) => {
  const {
    path: { getDirectory, joinPath },
    expect: { expectSuccess, expect },
    log: { logWarning },
  } = dependencies;
  const { extractGitInformation } = Git(dependencies);
  const hasPackageJSON = (directory) => {
    try {
      readFileSync(joinPath(directory, "package.json"), "utf8");
      return true;
    } catch (error) {
      const { code } = { code: null, ...error };
      expect(
        code === "ENOENT",
        "failed to attempt reading package.json >> %e",
        error,
      );
      return false;
    }
  };
  const createPackage = (directory) => {
    if (
      !expectSuccess(
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
      ...expectSuccess(
        () =>
          parse(
            expectSuccess(
              () => readFileSync(joinPath(directory, "package.json"), "utf8"),
              "could not read 'package.json' file from %j >> %e",
              directory,
            ),
          ),
        "could not parse 'package.json' file from %j >> %e",
        directory,
      ),
    };
    expect(
      name !== null,
      "missing name property in 'package.json' file from %j",
      directory,
    );
    expect(
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
      const { resolve } = createRequire(joinPath(repository, "dummy.js"));
      const path = expectSuccess(
        () => resolve(name),
        "could not resolve %j from %j >> %e",
        name,
        repository,
      );
      let directory = getDirectory(path);
      while (!hasPackageJSON(directory)) {
        const parent_directory = getDirectory(directory);
        expect(
          parent_directory !== directory,
          "failed to find package.json file from module %j in repository %j",
          name,
          repository,
        );
        directory = parent_directory;
      }
      return {
        directory,
        package: createPackage(directory),
      };
    },
  };
};
