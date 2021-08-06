import { writeFileSync } from "fs";
import { writeFile } from "fs/promises";

const { stringify } = JSON;
const _Map = Map;
const _String = String;

export default (dependencies) => {
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
    store: ({ directory, indent, postfix, versioning }, name, data) =>
      writeFileSync(
        `${directory}/${getName(versioning, name, postfix)}`,
        stringify(data, null, indent),
        "utf8",
      ),
    storeAsync: ({ directory, indent, postfix, versioning }, name, data) =>
      writeFile(
        `${directory}/${getName(versioning, name, postfix)}`,
        stringify(data, null, indent),
        "utf8",
      ),
  };
};
