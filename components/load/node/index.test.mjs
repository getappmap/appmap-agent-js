import {
  mkdir as mkdirAsync,
  writeFile as writeFileAsync,
} from "node:fs/promises";
import { assertEqual } from "../../__fixture__.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";
import { loadAsync, isLoadMissingError } from "./index.mjs";

const { Error, Symbol, URL } = globalThis;

const SUCCESS = Symbol("success");
const home = toAbsoluteUrl(`${getUuid()}/`, getTmpUrl());
await mkdirAsync(new URL(home));

const callFailureAsync = async (runAsync, ...args) => {
  try {
    await runAsync(...args);
    throw SUCCESS;
  } catch (error) {
    if (error === SUCCESS) {
      throw new Error("unexpected success");
    } else {
      return error;
    }
  }
};

const testAsync = async (filename, content, value, test_invalid) => {
  const url = toAbsoluteUrl(filename, home);
  assertEqual(isLoadMissingError(await callFailureAsync(loadAsync, url)), true);
  // Syntax errors in esm modules does not appear to be catchable
  if (test_invalid) {
    await writeFileAsync(new URL(url), "}{", "utf8");
    assertEqual(
      isLoadMissingError(await callFailureAsync(loadAsync, url)),
      false,
    );
  }
  await writeFileAsync(new URL(url), content, "utf8");
  assertEqual(await loadAsync(url), value);
};

// json && yaml //
for (const filename of ["file.json", "file.yaml", "file.yml"]) {
  await testAsync(filename, "123", 123, true);
}

// esm //
await testAsync("file.mjs", "export default 123;", 123, false);

// cjs //
await testAsync("file.cjs", "module.exports = 123;", 123, false);
