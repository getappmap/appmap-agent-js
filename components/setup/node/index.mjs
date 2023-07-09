import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "node:fs/promises";
import { createRequire } from "node:module";
import YAML from "yaml";
import Semver from "semver";
import Chalk from "chalk";
import { self_directory, self_package } from "../../self/index.mjs";
import { validateExternalConfiguration } from "../../validate/index.mjs";
import { questionConfigAsync } from "../../questionnaire/index.mjs";
import { hasOwnProperty, isFileNotFound } from "../../util/index.mjs";
import {
  convertPathToFileUrl,
  toAbsolutePath,
  getCwdPath,
} from "../../path/index.mjs";
import { toDirectoryUrl, toAbsoluteUrl } from "../../url/index.mjs";
import { prompts } from "../../prompts/index.mjs";

const { URL } = globalThis;

const { satisfies: satisfiesSemver } = Semver;
const { green: chalkGreen, yellow: chalkYellow, red: chalkRed } = Chalk;
const { parse: parseYAML, stringify: stringifyYAML } = YAML;

const generateLog = (prefix, writable) => (message) => {
  writable.write(`${prefix} ${message}${"\n"}`);
};

export const mainAsync = async (
  { version, cwd, env, stdout, stderr },
  testable_self_directory = self_directory,
) => {
  const logSuccess = generateLog(chalkGreen("\u2714"), stdout);
  const logWarning = generateLog(chalkYellow("\u26A0"), stderr);
  const logFailure = generateLog(chalkRed("\u2716"), stderr);
  const cwd_url = toDirectoryUrl(convertPathToFileUrl(cwd()));
  let conf_url = toAbsoluteUrl("appmap.yml", cwd_url);
  if (hasOwnProperty(env, "APPMAP_CONFIGURATION_PATH")) {
    conf_url = convertPathToFileUrl(
      toAbsolutePath(env.APPMAP_CONFIGURATION_PATH, getCwdPath({ cwd })),
    );
  }
  let repo_url = cwd_url;
  if (hasOwnProperty(env, "APPMAP_REPOSITORY_DIRECTORY")) {
    repo_url = toDirectoryUrl(
      convertPathToFileUrl(
        toAbsolutePath(env.APPMAP_REPOSITORY_DIRECTORY, getCwdPath({ cwd })),
      ),
    );
  }
  // node //
  if (!satisfiesSemver(version, self_package.engines.node)) {
    logFailure(
      `Node version ${version} is not compatible with ${self_package.engines.node}`,
    );
    return false;
  }
  logSuccess(`compatible node version: ${version}`);
  // configuration file //
  {
    let content;
    try {
      content = await readFileAsync(new URL(conf_url), "utf8");
    } catch (error) {
      /* c8 ignore start */
      if (!isFileNotFound(error)) {
        logFailure(`configuration file cannot be read: ${error}`);
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
    const { resolve } = createRequire(repo_url);
    let agent_main_path = null;
    try {
      agent_main_path = resolve("@appland/appmap-agent-js");
    } catch ({ message }) {
      logFailure(`cannot resolve appmap-agent-js module: ${message}`);
      return false;
    }
    const agent_main_url = convertPathToFileUrl(agent_main_path);
    const resolved_agent_url = toAbsoluteUrl("../../", agent_main_url);
    if (resolved_agent_url !== testable_self_directory) {
      logFailure(
        `agent location mismatch, expected agent to resolve to ${testable_self_directory} but got ${resolved_agent_url}`,
      );
      return false;
    }
    logSuccess("appmap-agent-js module is available");
  }
  // git repository //
  {
    let success = true;
    try {
      await readdirAsync(new URL(toAbsoluteUrl(".git", repo_url)));
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
        new URL(toAbsoluteUrl("package.json", repo_url)),
        "utf8",
      );
    } catch (error) {
      success = false;
      if (isFileNotFound(error)) {
        logWarning(`missing package.json file`);
      } /* c8 ignore start */ else {
        logWarning(`cannot read package.json file: ${error}`);
      } /* c8 ignore stop */
    }
    if (success) {
      logSuccess("package.json file exists");
    }
  }
  // overall success //
  return true;
};
