import {
  readFile as readFileAsync,
  writeFile as writeFileAsync,
  readdir as readdirAsync,
} from "fs/promises";
import { createRequire } from "module";
import { pathToFileURL } from "url";
import YAML from "yaml";
import Chalk from "chalk";

const _URL = URL;
const { green: chalkGreen, yellow: chalkYellow, red: chalkRed } = Chalk;
const { parse: parseYAML, stringify: stringifyYAML } = YAML;

export default (dependencies) => {
  const {
    validate: { validateConfig },
    questionnaire: { questionConfigAsync },
    util: { assert, hasOwnProperty },
    prompts: { prompts },
  } = dependencies;
  const generateLog = (prefix, writable) => (message) => {
    writable.write(`${prefix} ${message}${"\n"}`);
  };
  return {
    mainAsync: async ({ version, platform, cwd, env, stdout, stderr }) => {
      const url = pathToFileURL(cwd()).toString();
      const logSuccess = generateLog(chalkGreen("\u2714"), stdout);
      const logWarning = generateLog(chalkYellow("\u26A0"), stderr);
      const logFailure = generateLog(chalkRed("\u2716"), stderr);
      let conf_url = `${url}/appmap.yml`;
      if (hasOwnProperty(env, "APPMAP_CONFIGURATION_PATH")) {
        conf_url = pathToFileURL(env.APPMAP_CONFIGURATION_PATH);
      }
      let repo_url = url;
      if (hasOwnProperty(env, "APPMAP_REPOSITORY_DIRECTORY")) {
        repo_url = pathToFileURL(env.APPMAP_REPOSITORY_DIRECTORY);
      }
      // os //
      if (platform === "win32") {
        logFailure("unfortunately, windows is not currently supported");
        return false;
      }
      logSuccess(`unix-like os: ${platform}`);
      // node //
      {
        const parts = /^v([0-9][0-9])\./u.exec(version);
        assert(parts !== null, "invalid process.version format");
        const major = parseInt(parts[1]);
        if (major < 14) {
          logFailure(`incompatible node version (min 14.x), got: ${version}`);
          return false;
        }
        logSuccess(`compatible node version: ${version}`);
      }
      // configuration file //
      {
        let content;
        try {
          content = await readFileAsync(new _URL(conf_url), "utf8");
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
            await writeFileAsync(new _URL(conf_url), content, "utf8");
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
          validateConfig(config);
        } catch ({ message }) {
          logFailure(`configuration file is invalid: ${message}`);
          return false;
        }
        logSuccess("configuration file is valid");
      }
      // appmap-agent-js //
      {
        const { resolve } = createRequire(new _URL(`${repo_url}/dummy.js`));
        try {
          resolve("@appland/appmap-agent-js");
        } catch ({ message }) {
          logFailure(`cannot resolve appmap-agent-js module: ${message}`);
          return false;
        }
        logSuccess("appmap-agent-js module is available");
      }
      // git repository //
      {
        let success = true;
        try {
          await readdirAsync(new _URL(`${repo_url}/.git`));
        } catch ({ message }) {
          success = false;
          logWarning(
            `current working directory does not appear to be a git repository: ${message}`,
          );
        }
        if (success) {
          logSuccess(
            "current working directory appears to be a git repository",
          );
        }
      }
      // package json file //
      {
        let success = true;
        try {
          await readFileAsync(new URL(`${repo_url}/package.json`), "utf8");
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
    },
  };
};
