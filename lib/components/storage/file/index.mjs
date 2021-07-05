import Path from "path";
import FileSystem from "fs";
import FileSystemAsync from "fs/promises";

const getPath = (storage, name) => {
  if (storage.versioning.has(name)) {
    const counter = storage.versioning.get(name);
    storage.versioning.set(name, counter + 1);
    name = `${name}-${String(counter)}`;
  } else {
    storage.versioning.set(name, 1);
  }
  return Path.join(storage.directory, `${name}.appmap.json`);
};

class FileStorage {
  constructor(options) {
    options = {
      directory: "tmp/appmap",
      ...options,
    };
    this.versioning = new Map();
    this.directory = options.directory;
  }
  store(name, data) {
    FileSystem.writeFileSync(getPath(this, name), JSON.stringify(data), "utf8");
  }
  storeAsync(name, data) {
    return FileSystemAsync.writeFile(
      getPath(this, name),
      JSON.stringify(data),
      "utf8",
    );
  }
}

export default (dependencies, options) => new FileStorage(options);
