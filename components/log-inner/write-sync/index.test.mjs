const {
  String,
  URL,
  JSON: { stringify: stringifyJSON },
} = globalThis;

import { writeFile as writeFileAsync } from "node:fs/promises";
import "../../__fixture__.mjs";
import { getUuid } from "../../uuid/random/index.mjs";
import { getTmpUrl } from "../../path/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

import { logInfo } from "./index.mjs";
logInfo("message");

let counter = 0;

const testAsync = async (output) => {
  await writeFileAsync(
    new URL(toAbsoluteUrl("../../params.mjs", import.meta.url)),
    `export default {env:"test", "log-file":${stringifyJSON(output)}};`,
    "utf8",
  );
  counter += 1;
  const { logInfo } = await import(`./index.mjs#${String(counter)}`);
  logInfo("message");
  await writeFileAsync(
    new URL(toAbsoluteUrl("../../params.mjs", import.meta.url)),
    `export default {env:"test"};`,
    "utf8",
  );
};

await testAsync("2");

await testAsync(toAbsoluteUrl(getUuid(), getTmpUrl()));
