const { encodeURIComponent } = globalThis;

import { getFreshTemporaryURL } from "../../__fixture__.mjs";

const testAsync = async (url) => {
  const { logInfo } = await import(url);
  logInfo("foo %s", "bar");
};

await testAsync("./index.mjs?env=test");

await testAsync("./index.mjs?env=test&log-file=2");

await testAsync(
  `./index.mjs?env=test&log-file=${encodeURIComponent(getFreshTemporaryURL())}`,
);
