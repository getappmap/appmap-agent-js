import Path from "path";
import FileSystem from "fs";

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
    if (this.versioning.has(name)) {
      const counter = this.versioning.get(name);
      this.versioning.set(name, counter + 1);
      name = `${name}-${String(counter)}`;
    } else {
      this.versioning.set(name, 1);
    }
    FileSystem.writeFileSync(
      Path.join(this.directory, `${name}.appmap.json`),
      JSON.stringify(data),
      "utf8",
    );
  }
}

export default (dependencies, options) => new FileStorage(options);
