const {
  URL,
  JSON: { parse: parseJSON },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { createRequire } from "module";
import YAML from "yaml";
import Semver from "semver";
import Chalk from "chalk";
const { validateExternalConfiguration } = await import(
  `../../validate/index.mjs${__search}`
);
const { questionConfigAsync } = await import(
  `../../questionnaire/index.mjs${__search}`
);
const { hasOwnProperty } = await import(`../../util/index.mjs${__search}`);
const { urlifyPath, appendURLSegment, appendURLSegmentArray } = await import(
  `../../url/index.mjs${__search}`
);
const { prompts } = await import(`../../prompts/index.mjs${__search}`);

const { satisfies: satisfiesSemver } = Semver;
const { green: chalkGreen, yellow: chalkYellow, red: chalkRed } = Chalk;
const { parse: parseYAML, stringify: stringifyYAML } = YAML;

const generateLog = (prefix, writable) => (message) => {
  writable.write(`${prefix} ${message}${"\n"}`);
};

export const mainAsync = async ({ version, cwd, env, stdout, stderr }) => {
  const logSuccess = generateLog(chalkGreen("\u2714"), stdout);
  const logWarning = generateLog(chalkYellow("\u26A0"), stderr);
  const logFailure = generateLog(chalkRed("\u2716"), stderr);
  const cwd_url = urlifyPath(cwd(), "file:///");
  const { href: agent_url } = new URL("../../..", import.meta.url);
  let conf_url = appendURLSegment(cwd_url, "appmap.yml");
  if (hasOwnProperty(env, "APPMAP_CONFIGURATION_PATH")) {
    conf_url = urlifyPath(env.APPMAP_CONFIGURATION_PATH, cwd_url);
  }
  let repo_url = cwd_url;
  if (hasOwnProperty(env, "APPMAP_REPOSITORY_DIRECTORY")) {
    repo_url = urlifyPath(env.APPMAP_REPOSITORY_DIRECTORY, cwd_url);
  }
  // node //
  {
    const _package = parseJSON(
      await readFileAsync(
        new URL(appendURLSegment(agent_url, "package.json")),
        "utf8",
      ),
    );
    if (!satisfiesSemver(version, _package.engines.node)) {
      logFailure(
        `Node version ${version} is not compatible with ${_package.engines.node}`,
      );
      return false;
    }
    logSuccess(`compatible node version: ${version}`);
  }
  // configuration file //
  {
    let content;
    try {
      content = await readFileAsync(new URL(conf_url), "utf8");
    } catch ({ code, message }) {
      /* c8 ignore start */
      if (code !== "ENOENT") {
        logFailure(`configuration file cannot be read: ${message}`);
        return false;
      }
      /* c8 ignore stop */
      if (
        !(
          await prompts({
            type: "toggle",
            name: "value",
            message:
              "Do you wish to answer several questions to help you create a configuration file?",
            initial: true,
            active: "yes",
            inactive: "no",
          })
        ).value
      ) {
        logFailure("missing configuration file");
        return false;
      }
      /* c8 ignore start */
      content = stringifyYAML(await questionConfigAsync());
      try {
        await writeFileAsync(new URL(conf_url), content, "utf8");
      } catch ({ message }) {
        logFailure(`configuration file cannot not be written: ${message}`);
        return false;
      }
      /* c8 ignore stop */
    }
    logSuccess("configuration file exists");
    let config;
    try {
      config = parseYAML(content);
    } catch ({ message }) {
      logFailure(`configuration file is not valid YAML: ${message}`);
      return false;
    }
    logSuccess("configuration file is valid YAML");
    try {
      validateExternalConfiguration(config);
    } catch ({ message }) {
      logFailure(`configuration file is invalid: ${message}`);
      return false;
    }
    logSuccess("configuration file is valid");
  }
  // appmap-agent-js //
  {
    const { resolve } = createRequire(
      new URL(appendURLSegment(repo_url, "dummy.js")),
    );
    let agent_main = null;
    try {
      agent_main = resolve("@appland/appmap-agent-js");
    } catch ({ message }) {
      logFailure(`cannot resolve appmap-agent-js module: ${message}`);
      return false;
    }
    logSuccess("appmap-agent-js module is available");
    const resolved_agent_url = appendURLSegmentArray(
      urlifyPath(agent_main, "file:///"),
      ["..", "..", ".."],
    );
    /* c8 ignore start */
    if (agent_url !== resolved_agent_url) {
      logFailure(
        `agent location mismatch, expected agent to resolve to ${agent_url} but got ${resolved_agent_url}`,
      );
      return false;
    }
    /* c8 ignore stop */
  }
  // git repository //
  {
    let success = true;
    try {
      await readdirAsync(new URL(appendURLSegment(repo_url, ".git")));
    } catch ({ message }) {
      success = false;
      logWarning(
        `current working directory does not appear to be a git repository: ${message}`,
      );
    }
    if (success) {
      logSuccess("current working directory appears to be a git repository");
    }
  }
  // package json file //
  {
    let success = true;
    try {
      await readFileAsync(
        new URL(appendURLSegment(repo_url, "package.json")),
        "utf8",
      );
    } catch ({ code, message }) {
      success = false;
      if (code === "ENOENT") {
        logWarning(`missing package.json file`);
      } /* c8 ignore start */ else {
        logWarning(`cannot read package.json file: ${message}`);
      } /* c8 ignore stop */
    }
    if (success) {
      logSuccess("package.json file exists");
    }
  }
  // overall success //
  return true;
};
