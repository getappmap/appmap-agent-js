import { writeFileSync, lstatSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";

const { stringify } = JSON;
const _Map = Map;
const _String = String;

export default (dependencies) => {
  const {
    util: { getDirectory, getBasename, mapMaybe },
    expect: { expect },
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
  const getPath = (
    storage,
    {
      name,
      app,
      main,
      repository: { package: _package },
      output: { directory, indent, postfix, filename },
    },
  ) =>
    `${directory}/${getFreeName(
      storage,
      filename ||
        name ||
        mapMaybe(main, getBasename) ||
        app ||
        mapMaybe(_package, getName) ||
        "anonymous",
      postfix,
    )}`;
  /* c8 ignore start */
  const getName = ({ name }) => name;
  /* c8 ignore stop */
  const getFreeName = (versioning, name, postfix) => {
    if (versioning.has(name)) {
      const counter = versioning.get(name);
      versioning.set(name, counter + 1);
      name = `${name}-${_String(counter)}`;
    } else {
      versioning.set(name, 1);
    }
    return `${name}${postfix}.json`;
  };
  return {
    createStorage: () => new _Map(),
    store: (versioning, configuration, data) => {
      const {
        output: { directory, indent },
      } = configuration;
      const path = getPath(versioning, configuration);
      createDirectory(directory);
      writeFileSync(path, stringify(data, null, indent), "utf8");
      logInfo("trace file (synchronously) written at: %j", path);
    },
    storeAsync: async (versioning, configuration, data) => {
      const {
        output: { directory, indent },
      } = configuration;
      const path = getPath(versioning, configuration);
      createDirectory(directory);
      await writeFile(path, stringify(data, null, indent), "utf8");
      logInfo("trace file (synchronously) written at: %j", path);
    },
  };
};
