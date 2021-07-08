import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { strict as Assert } from "assert";
import component from "./index.mjs";

const { store, storeAsync } = component({}, {}).create({
  directory: "tmp",
});

spawnSync("rm", ["tmp/foo.appmap.json", "-f"]);
spawnSync("rm", ["tmp/foo-1.appmap.json", "-f"]);

store("foo", 123);
Assert.equal(JSON.parse(readFileSync("tmp/foo.appmap.json", "utf8")), 123);
storeAsync("foo", 456).then(() => {
  Assert.equal(JSON.parse(readFileSync("tmp/foo-1.appmap.json", "utf8")), 456);
});
