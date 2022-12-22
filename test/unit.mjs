import { lstat as lstatAsync, readdir as readdirAsync } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Chalk from "chalk";
import { spawnAsync } from "./spawn.mjs";

const {
  URL,
  process: { stdout },
  String,
} = globalThis;

const { green: chalkGreen, blue: chalkBlue, red: chalkRed } = Chalk;

const failures = [];

const loop = async (url) => {
  if (url.href.endsWith(".test.mjs")) {
    stdout.write(chalkBlue(`${url.href}...\n`));
    const { signal, status } = await spawnAsync(
      "node",
      ["--unhandled-rejections=strict", fileURLToPath(url)],
      { stdio: "inherit" },
    );
    if (signal !== null) {
      stdout.write(chalkRed(`Killed by ${signal}\n`));
      failures.push(url.href);
    } else if (status !== 0) {
      stdout.write(chalkRed(`Exit code ${String(status)}\n`));
      failures.push(url.href);
    } else {
      stdout.write(chalkGreen("Success\n"));
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
  stdout.write(chalkGreen("All passed\n"));
} else {
  stdout.write(chalkRed(`Failures:\n  - ${failures.join("\n  - ")}\n`));
}
