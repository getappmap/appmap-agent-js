import { platform as getPlatform } from "node:os";
import { resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  readFile as readFileAsync,
  rm as rmAsync,
  mkdir as mkdirAsync,
  readdir as readdirAsync,
} from "node:fs/promises";
import { argv, cwd as getCwd } from "node:process";
import { parse as parseYAML } from "yaml";
import glob from "glob";
import minimist from "minimist";
import { logTitle, logFailure } from "./log.mjs";
import { match } from "./match.mjs";
import { hasOwn } from "./util.mjs";
import { spawnStrictAsync } from "./spawn.mjs";

const {
  Error,
  URL,
  Promise,
  JSON: { parse: parseJSON },
} = globalThis;

const globAsync = (pattern, url) =>
  new Promise((resolve, reject) => {
    glob(pattern, { cwd: fileURLToPath(url) }, (error, paths) => {
      if (error) {
        reject(error);
      } else {
        resolve(paths.map((path) => new URL(path, url)));
      }
    });
  });

const toDirectoryUrl = (url) => {
  url = new URL(url);
  if (!url.pathname.endsWith("/")) {
    url.pathname += "/";
  }
  return url;
};

const readFileMaybeAsync = async (url) => {
  try {
    return await readFileAsync(url, "utf8");
  } catch (error) {
    if (hasOwn(error, "code") && error.code === "ENOENT") {
      return null;
    } else {
      throw error;
    }
  }
};

const npm = getPlatform() === "win32" ? "npm.cmd" : "npm";

const shell = getPlatform() === "win32" ? "cmd.exe" : "/bin/sh";

const shell_command_flag = getPlatform() === "win32" ? "/c" : "-c";

const changeUrlExtension = (url, ext1, ext2) => {
  if (url.pathname.endsWith(ext1)) {
    url = new URL(url);
    url.pathname = url.pathname.substring(0, url.pathname.length - ext1.length);
    url.pathname += ext2;
    return url;
  } else {
    throw new Error("unexpected url");
  }
};

const testAsync = async (test_url, bin_url) => {
  const spec = {
    commands: ["node $1"],
    actual: ".appmap.json",
    expect: ".subset.yaml",
    ...parseYAML(
      (await readFileMaybeAsync(new URL("spec.yaml", test_url))) ?? "{}",
    ),
  };
  await Promise.all(
    (
      await globAsync(`**/*${spec.actual}`, test_url)
    ).map((path) => rmAsync(path)),
  );
  for (const command of spec.commands) {
    await spawnStrictAsync(
      shell,
      // Very crude variable substitution.
      // It is hard to come up with a portable command for both posix and win32.
      // For intance: `$1` vs `$args[1]`
      [
        shell_command_flag,
        command.replace(/\$1/u, () => fileURLToPath(bin_url)),
      ],
      {
        stdio: "inherit",
        cwd: test_url,
      },
    );
  }
  for (const expect_url of await globAsync(`**/*${spec.expect}`, test_url)) {
    const actual_url = changeUrlExtension(expect_url, spec.expect, spec.actual);
    if (
      !match(
        { url: actual_url, content: await readFileAsync(actual_url, "utf8") },
        { url: expect_url, content: await readFileAsync(expect_url, "utf8") },
      )
    ) {
      logFailure(`output mismatch at ${actual_url}`);
      throw new Error("Output mismatch");
    }
  }
};

const packAsync = async (cwd) => {
  const { version } = parseJSON(
    await readFileAsync(new URL("package.json", cwd), "utf8"),
  );
  await spawnStrictAsync(npm, ["pack", "--pack-destination", "tmp"], {
    cwd,
    stdio: "inherit",
  });
  await mkdirAsync(new URL("test/pack/node_modules", cwd), { recursive: true });
  await spawnStrictAsync(
    npm,
    ["install", `../../tmp/appland-appmap-agent-js-${version}.tgz`],
    {
      cwd: new URL("test/pack", cwd),
      stdio: "inherit",
    },
  );
  return new URL(
    "test/pack/node_modules/@appland/appmap-agent-js/bin/appmap-agent-js.cjs",
    cwd,
  );
};

const fetchTestUrlArrayAsync = async (positional, cwd) => {
  if (positional.length === 0) {
    return (await readdirAsync(new URL(`test/cases`, cwd))).map(
      (name) => new URL(`test/cases/${name}/`, cwd),
    );
  } else {
    return positional.map((path) =>
      toDirectoryUrl(pathToFileURL(resolvePath(fileURLToPath(cwd), path))),
    );
  }
};

const mainAsync = async (options, cwd) => {
  const bin_url = options.pack
    ? await packAsync(cwd)
    : new URL("bin/appmap-agent-js.cjs", cwd);
  for (const test_url of await fetchTestUrlArrayAsync(options._, cwd)) {
    logTitle(`${test_url} ...`);
    await testAsync(test_url, bin_url);
  }
};

await mainAsync(
  {
    pack: false,
    ...minimist(argv.slice(2)),
  },
  toDirectoryUrl(pathToFileURL(getCwd())),
);
