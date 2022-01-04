import { assertEqual, assertDeepEqual } from "../../__fixture__.mjs";
import {
  buildTestDependenciesAsync,
  buildTestComponentAsync,
} from "../../build.mjs";
import Questionnaire from "./index.mjs";

const BREAK = {};

const { validateConfig } = await buildTestComponentAsync("validate");

const { questionConfigAsync } = Questionnaire(
  await buildTestDependenciesAsync(import.meta.url, {
    prompts: "fake",
  }),
);

const runAsync = async (answers) => {
  const iterator = answers[Symbol.iterator]();
  global.GLOBAL_PROMPTS = async ({ name, ...prompt }) => {
    const answer = iterator.next().value(prompt);
    if (answer === BREAK) {
      return {};
    }
    return { [name]: answer };
  };
  const configuration = await questionConfigAsync();
  assertEqual(iterator.next().done, true);
  validateConfig(configuration);
  return configuration;
};

// {recorder:"process"} //
assertDeepEqual(
  await runAsync([
    ({ format }) => format("app-name"),
    ({ choices }) => choices[0].value,
    ({ format }) => format('["exec", "arg0"]'),
    ({ format }) => format("output-directory"),
    ({ format }) => format(["esm", "cjs"]),
    ({ choices }) => choices[0].value,
    // ({ format }) => format(["process1", "process2"]),
    // ({ format }) => format(["package1", "package2"]),
    ({ format }) => format(true),
    ({ choices }) => choices[0].value,
  ]),
  {
    name: "app-name",
    recorder: "process",
    command: ["exec", "arg0"],
    output: {
      directory: "output-directory",
    },
    hooks: {
      esm: true,
      cjs: true,
      http: false,
      mysql: false,
      pg: false,
      sqlite3: false,
    },
    ordering: "chronological",
    // processes: [{ glob: "process1" }, { glob: "process2" }],
    // packages: [{ glob: "package1" }, { glob: "package2" }],
    pruning: false,
    log: "debug",
  },
);

// {recorder:"mocha"} //
assertDeepEqual(
  await runAsync([
    ({ format }) => format(""),
    ({ choices }) => choices[1].value,
    ({}) => BREAK,
  ]),
  {
    recorder: "mocha",
  },
);

// {recorder:"remote"} //
assertDeepEqual(
  await runAsync([
    ({ format }) => format(""),
    ({ choices }) => choices[2].value,
    ({ format }) => format(""),
    ({ format, validate }) => {
      assertEqual(validate("0"), true);
      return format("0");
    },
    ({ format, validate }) => {
      assertEqual(validate("unix-domain-socket"), true);
      return format("unix-domain-socket");
    },
    ({}) => BREAK,
  ]),
  {
    recorder: "remote",
    "track-port": 0,
    "intercept-track-port": "unix-domain-socket",
  },
);

// {recorder:"manual"} //
assertDeepEqual(
  await runAsync([
    ({ format }) => format(""),
    ({ choices }) => choices[3].value,
    ({ format }) => format(["http"]),
    ({ choices }) => choices[1].value,
    ({ format }) => format(false),
    ({ choices }) => choices[4].value,
  ]),
  {
    recorder: "manual",
    hooks: {
      esm: false,
      cjs: false,
      http: true,
      mysql: false,
      pg: false,
      sqlite3: false,
    },
    ordering: "causal",
    packages: [{ enabled: true, regexp: "^", flags: "u" }],
    pruning: true,
    log: "off",
  },
);
