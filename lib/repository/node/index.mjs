import { createRequire } from "module";
import { readFileSync } from "fs";
import Git from "./git.mjs";

const { parse } = JSON;

export default (dependencies) => {
  const {
    assert: { assertSuccess, assert },
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
    extractRepositoryDependencyPackage: (path1, name) => {
      const { resolve } = createRequire(path1);
      const path2 = assertSuccess(
        () => resolve(name),
        "could not resolve %j from %j >> %e",
        name,
        path1,
      );
      const index = path2.indexOf(`/${name}/`);
      assert(
        index !== -1,
        "could not find %j in %j which come from %j",
        name,
        path2,
        path1,
      );
      const directory = `${path2.substring(0, index)}/${name}`;
      return {
        directory,
        package: createPackage(directory),
      };
    },
  };
};
