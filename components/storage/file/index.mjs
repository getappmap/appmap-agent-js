import { writeFileSync, lstatSync, mkdirSync } from "fs";

const { stringify } = JSON;

export default (dependencies) => {
  const {
    util: { getDirectory },
    expect: { expect, expectSuccess },
    log: { logInfo },
  } = dependencies;
  const isDirectory = (directory) => {
    try {
      return lstatSync(directory).isDirectory();
    } catch (error) {
      const { code } = error;
      expect(
        code === "ENOENT",
        "cannot read directory status %j >> %e",
        directory,
        error,
      );
      return null;
    }
  };
  const createDirectory = (directory) => {
    expect(
      directory !== "",
      "could not find any existing directory in the hiearchy of the storage directory",
    );
    const status = isDirectory(directory);
    expect(
      status !== false,
      "cannot create directory %j because it is a file",
      directory,
    );
    if (status === null) {
      createDirectory(getDirectory(directory));
      mkdirSync(directory);
    }
  };
  return {
    store: ({ path, data }) => {
      const content = stringify(data);
      try {
        writeFileSync(path, content, "utf8");
      } catch (error) {
        const { code } = error;
        expect(
          code === "ENOENT",
          "cannot write trace to %j >> %e",
          path,
          error,
        );
        createDirectory(getDirectory(path));
        expectSuccess(
          () => writeFileSync(path, content, "utf8"),
          "cannot write trace to %j >> %e",
          path,
        );
      }
      logInfo("trace written to %j", path);
    },
  };
};
