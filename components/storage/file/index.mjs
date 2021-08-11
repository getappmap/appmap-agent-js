import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";

const { stringify } = JSON;
const _Map = Map;
const _String = String;

export default (dependencies) => {
  const {
    log: { logInfo },
  } = dependencies;
  const getName = (versioning, name, postfix) => {
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
    createStorage: ({ output: { directory, indent, postfix } }) => ({
      directory,
      indent,
      postfix,
      versioning: new _Map(),
    }),
    store: ({ directory, indent, postfix, versioning }, name, data) => {
      const path = `${directory}/${getName(versioning, name, postfix)}`;
      writeFileSync(path, stringify(data, null, indent), "utf8");
      logInfo("trace file (synchronously) written at: %j", path);
    },
    storeAsync: async (
      { directory, indent, postfix, versioning },
      name,
      data,
    ) => {
      const path = `${directory}/${getName(versioning, name, postfix)}`;
      await writeFile(path, stringify(data, null, indent), "utf8");
      logInfo("trace file (asynchronously) written at: %j", path);
    },
  };
};
