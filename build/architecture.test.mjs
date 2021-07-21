import { strict as Assert } from "assert";
import { writeFile, mkdir, rm } from "fs/promises";
import { tmpdir } from "os";
import { buildAsync, buildOneAsync } from "./index.mjs";

const { random } = Math;
const {assertDeepEqual:deepEqual} = Assert;

const mainAsync = async () => {
  const root = `${tmpdir()}/${random().toString(36).substring(2)}`;
  try {
    await mkdir(root);
    await mkdir(`${root}/type`);
    await mkdir(`${root}/type/name`);
    await writeFile(`${root}/type/name/.deps.yml`, "[]", "utf8");
    assertDeepEqual(
      loadArchitectureAsync(root),
      {
        __proto__: null,
        type: {
          name: []
        }
      }
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

mainAsync();
