const { encodeURIComponent } = globalThis;

import "../../__fixture__.mjs";

import { getUuid } from "../../uuid/random/index.mjs";

import { getTmpUrl } from "../../path/index.mjs";

import { toAbsoluteUrl } from "../../url/index.mjs";

const testAsync = async (url) => {
  const { logInfo } = await import(url);
  logInfo("message");
};

await testAsync("./index.mjs");

await testAsync("./index.mjs&log-file=2");

await testAsync(
  `./index.mjs&log-file=${encodeURIComponent(
    toAbsoluteUrl(getUuid(), getTmpUrl()),
  )}`,
);
