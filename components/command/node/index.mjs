import { platform } from "node:process";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { logWarningWhen } from "../../log/index.mjs";
import { extendConfiguration } from "../../configuration/index.mjs";
import { resolveShell } from "./escape.mjs";
import { tokenize } from "./tokenize.mjs";
import * as MochaRecorder from "./mocha.mjs";
import * as JestRecorder from "./jest.mjs";
import * as ProcessRecorder from "./process.mjs";
import * as ProcessRecorderRecursive from "./process-recursive.mjs";
import * as RemoteRecorder from "./remote.mjs";
import * as RemoteRecorderRecursive from "./remote-recursive.mjs";

export const Recorders = [
  MochaRecorder,
  JestRecorder,
  ProcessRecorder,
  ProcessRecorderRecursive,
  RemoteRecorder,
  RemoteRecorderRecursive,
];

const {
  JSON: { stringify: stringifyJSON },
} = globalThis;

const platform_command_key = `command-${platform}`;

export const pickPlatformSpecificCommand = (configuration) => {
  if (
    hasOwnProperty(configuration, platform_command_key) &&
    configuration[platform_command_key] !== null
  ) {
    return {
      ...configuration,
      command: configuration[platform_command_key],
    };
  } else {
    return configuration;
  }
};

export const resolveConfigurationAutomatedRecorder = (configuration, env) => {
  assert(
    configuration.command !== null,
    "missing command in configuration",
    InternalAppmapError,
  );
  let {
    "recursive-process-recording": recursive,
    recorder,
    command: { source, tokens },
    "command-options": options,
  } = configuration;
  logWarningWhen(
    tokens !== null && options.shell !== false,
    "Tokenized commands (%j) are directly spawned so the provided shell (%j) is a no-op",
    tokens,
    options.shell,
  );
  if (tokens === null) {
    assert(
      source !== "null",
      "either command.tokens or command.source should be defined",
      InternalAppmapError,
    );
    tokens = tokenize(source, resolveShell(options.shell, env));
  }
  if (recorder === null) {
    recorder = "process";
    if (configuration.command.tokens !== null) {
      for (const Recorder of Recorders) {
        if (Recorder.recursive === recursive || Recorder.recursive === null) {
          if (Recorder.doesSupport(tokens)) {
            recorder = Recorder.name;
            break;
          }
        }
      }
    }
  }
  return extendConfiguration(
    configuration,
    {
      recorder,
      command: tokens,
      "command-options": {
        ...options,
        shell: false,
      },
    },
    configuration.repository.directory,
  );
};

export const compileConfigurationCommandAsync = async (configuration, env) => {
  assert(
    configuration.agent !== null,
    "missing agent in configuration",
    InternalAppmapError,
  );
  assert(
    configuration.command !== null,
    "missing command in configuration",
    InternalAppmapError,
  );
  assert(
    configuration.command.tokens !== null,
    "command should have been tokenized",
    InternalAppmapError,
  );
  const {
    "recursive-process-recording": recursive,
    recorder,
    agent: { directory },
    command: { tokens },
    "command-options": options,
  } = configuration;
  env = {
    ...env,
    ...options.env,
    APPMAP_CONFIGURATION: stringifyJSON(configuration),
  };
  const { hookCommandAsync, hookEnvironment } = Recorders.find(
    ({ recursive: recorder_recursive, name }) =>
      (recorder_recursive === null || recorder_recursive === recursive) &&
      name === recorder,
  );
  const [exec, ...argv] = await hookCommandAsync(tokens, directory);
  return {
    exec,
    argv,
    options: {
      ...options,
      env: hookEnvironment(env, directory),
    },
  };
};
