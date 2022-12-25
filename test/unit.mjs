import { lstat as lstatAsync, readdir as readdirAsync } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { logTitle, logSuccess, logFailure } from "./log.mjs";
import { spawnAsync } from "./spawn.mjs";

const { URL, String } = globalThis;

const failures = [];

const loop = async (url) => {
  if (url.href.endsWith(".test.mjs")) {
    logTitle(`${url.href}...`);
    const { signal, status } = await spawnAsync(
      "node",
      ["--unhandled-rejections=strict", fileURLToPath(url)],
      { stdio: "inherit" },
    );
    if (signal !== null) {
      logFailure(`Killed by ${signal}`);
      failures.push(url.href);
    } else if (status !== 0) {
      logFailure(`Exit code ${String(status)}`);
      failures.push(url.href);
    } else {
      logSuccess("Success");
    }
  } else if (url.href.endsWith("/")) {
    for (const filename of await readdirAsync(url)) {
      await loop(
        new URL(
          (await lstatAsync(new URL(filename, url))).isDirectory()
            ? `${filename}/`
            : filename,
          url,
        ),
      );
    }
  }
};

await loop(new URL("../components/", import.meta.url));

if (failures.length === 0) {
  logSuccess("All passed");
} else {
  logFailure(`Failures:\n  - ${failures.join("\n  - ")}\n`);
}
