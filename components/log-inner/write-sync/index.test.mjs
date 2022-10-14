const { encodeURIComponent } = globalThis;

import "../../__fixture__.mjs";

import { getUuid } from "../../uuid/random/index.mjs?env=test";

import { getTmpUrl } from "../../path/index.mjs?env=test";

import { toAbsoluteUrl } from "../../url/index.mjs?env=test";

const testAsync = async (url) => {
  const { logInfo } = await import(url);
  logInfo("foo %s", "bar");
};

await testAsync("./index.mjs?env=test");

await testAsync("./index.mjs?env=test&log-file=2");

await testAsync(
  `./index.mjs?env=test&log-file=${encodeURIComponent(
    toAbsoluteUrl(getUuid(), getTmpUrl()),
  )}`,
);
