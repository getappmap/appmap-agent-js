const { parseInt } = Number;
const { assign } = Object;

const { fromEntries } = Object;

export default (dependencies) => {
  const {
    prompts: { prompts },
    util: { constant, hasOwnProperty },
  } = dependencies;

  // const generateMakeGlobSpecifier = (enabled) => (glob) => ({enabled, glob});
  // const makeEnabledGlobSpecifier = generateMakeGlobSpecifier(true);
  // const makeDisabledGlobSpecifier = generateMakeGlobSpecifier(false);

  // Validate //

  const generateValidatePort = (randomable) => (input) => {
    if (/^[0-9]+$/u.test(input)) {
      const port = parseInt(input);
      /* c8 ignore start */
      if (!randomable && port === 0) {
        return "Couldn't assign a random port.";
      }
      if (port > 65535) {
        return "Entered port number is out of valid range (1..65535).";
      }
      /* c8 ignore stop */
    }
    return true;
  };

  // Parse //

  const parsePossibleInteger = (input) =>
    /^[0-9]+$/u.test(input) ? parseInt(input) : input;

  // Format //

  const questions = [
    // Naming //
    constant({
      type: "text",
      name: "value",
      initial: "",
      message: [
        "Enter application name:",
//        "Leave blank for a default name.",
      ],
      format: (app) => (app === "" ? {} : { app }),
    }),
    // Recorder //
    constant({
      type: "select",
      name: "value",
      initial: 0,
      message: ["Select recording method:"],
      choices: [
        {
          title: "Record mocha test cases when they run",
          value: { recorder: "mocha", mode: "local" },
          description: [
            "An AppMap will be recorded from each mocha test case.",
          ].join(""),
        },
        {
          title: "Use remote recording to record node processes",
          value: { recorder: "remote", mode: "remote" },
          description: [
            "Manually start/stop recording of a running node process."
//            "Use the UI controls in AppMap extensions for popular IDEs to start/stop recording:\n",
//            " - VSCode: https://marketplace.visualstudio.com/items?itemName=appland.appmap\n",
//            " - JetBrains: https://plugins.jetbrains.com/plugin/16701-appmap",
          ].join(""),
        },
        {
          title: "Record node processes, start to finish",
          value: { recorder: "process", mode: "local" },
          description: [
            "An AppMap will be recorded from each spawned node process.",
          ].join(""),
        },

        {
          title: "Programmatically record node processes",
          value: {
            recorder: "manual",
            hooks: { cjs: false, esm: false },
            packages: [{ regexp: "^", flags: "u", enabled: true }],
          },
          description: [
            "Start/stop recording with AppMap API in the recorded application.",
//            "Use `appmap.recordScript(code, path)` to record your running code.",
          ].join(""),
        },
      ],
    }),
    // Scenario //
    ({ recorder }) =>
      recorder === "manual"
        ? null
        : {
            type: "text",
            name: "value",
            message: [
              "Enter command to start the recorded application: (example: 'node path/to/main.js argv0 argv1')",
//              "Leave blank to pass it as a paremter later: `npx appmap-agent-js -- node path/to/main.js argv0 argv1`",
            ],
            initial: "",
            format: (input) =>
              input === ""
                ? {}
                : {
                    scenario: "my-scenario",
                    scenarios: { "my-scenario": input },
                  },
          },
    // Remote Recording //
    ({ recorder }) =>
    recorder !== "remote"
      ? null
      : {
          type: "text",
          name: "value",
          message: [
            "Enter HTTP port of the recorded application (typical values: 3000, 4000, 8000):",
            "The agent will be expecting the app to be accepting HTTP requests on this port.",
            //"Enter a port number (1..65535) or a path to a unix domain socket.",
            "Leave blank to not use the application port for remote recording control.",
          ],
          initial: "",
          validate: generateValidatePort(false),
          format: (input) => ({
            "intercept-track-port": parsePossibleInteger(input),
          }),
        },
    ({ recorder }) =>
      recorder !== "remote"
        ? null
        : {
            type: "text",
            name: "value",
            message: [
              "Enter fallback port for remote recording control: (1..65535, 0 for auto-assigned)",
//              "Either provide a port number or a path to a unix domain socket.",
//              "Enter `0` for random selection.",
            ],
            initial: "0",
            validate: generateValidatePort(true),
            format: (input) => ({
              "track-port": parsePossibleInteger(input),
            }),
          },
    // Storage //
    ({ recorder }) =>
      recorder !== "process" && recorder !== "mocha"
        ? null
        : {
            type: "text",
            name: "value",
            message: [
              "Enter AppMap output directory: (default: `tmp/appmap`)",
   //           "Recorded AppMap files will be saved in this directory. Default: `tmp/appmap`.",
            ],
            initial: "tmp/appmap",
            format: (directory) => ({ output: { directory } }),
          },
    // Hooks //
    ({ recorder }) => ({
      type: "multiselect",
      name: "value",
      message: ["Select recording scope - what events get recorded:"],
      instructions: false,
      choices: [
        {
          title: "Functions located in CommonJS modules",
          value: "cjs",
          disabled: recorder === "manual",
          selected: recorder !== "manual",
        },
        {
          title: "Functions located in native modules",
          value: "esm",
          disabled: recorder === "manual",
          selected: recorder !== "manual",
        },
        {
          title: "HTTP requests",
          value: "http",
          disabled: false,
          selected: true,
        },
        {
          title: "MySQL commands (`mysql` dependency is required in package.json)",
          value: "mysql",
          disabled: false,
          selected: false,
        },
        {
          title: "PostgreSQL commands (`pg` dependency is required in package.json)",
          value: "pg",
          disabled: false,
          selected: false,
        },
        {
          title: "SQLite3 commands (`sqlite3` dependency is required in package.json)",
          value: "sqlite3",
          disabled: false,
          selected: false,
        },
      ],
      format: (keys) => ({
        hooks: {
          esm: false,
          cjs: false,
          http: false,
          mysql: false,
          pg: false,
          sqlite3: false,
          ...fromEntries(keys.map((key) => [key, true])),
        },
      }),
    }),
    constant({
      type: "select",
      name: "value",
      message: ["Select ordering of events in recorded AppMaps:"],
      initial: 0,
      choices: [
        {
          title: "Chronological",
          value: { ordering: "chronological" },
          description: "Events will be recorded in their chronological order",
        },
        {
          title: "Causal",
          value: { ordering: "causal" },
          description: [
            "Events will be re-ordered based on causality links\n",
            "Casual orderding offers better user experience at the expense of a small processing overhead:\n",
            " - asynchronous callbacks will be presented as nested events rather than root events in the Trace",
          ].join(""),
        },
      ],
    }),
    // Whitelisting //
    // ({ recorder }) =>
    //   recorder === "manual"
    //     ? null
    //     : {
    //         type: "list",
    //         name: "value",
    //         message: [
    //           "What are the node processes that should be recorded?",
    //           "Useful to prevent child node processes from being recorded.",
    //           "Whitelisting is based on the path of the entry script.",
    //           "Provide a coma-separated list of globs.",
    //         ],
    //         initial: "bin/*, test/*, test/**/*",
    //         separator: ",",
    //         format: (globs) => ({ processes: globs.map(makeGlobSpecifier) }),
    //       },
    // ({ recorder }) =>
    //   recorder === "manual"
    //     ? null
    //     : {
    //         type: "list",
    //         name: "value",
    //         message: [
    //           "What are the files that should be recorded?",
    //           "By default, every files inside the repository are recorded."
    //           "Safe for files within `node_modules` directories which are ignored."
    //           "Provide a coma-separated list of globs.",
    //         ],
    //         initial: "",
    //         separator: ",",
    //         format: (globs) => ({ packages: globs.map(makeEnabledGlobSpecifier) }),
    //       },
    // Pruning //
    ({ recorder }) => ({
      type: "toggle",
      name: "value",
      message: ["Keep imported sources that were not executed during recording in class maps? (default: yes, no for mocha tests)"],
      initial: recorder !== "mocha",
      active: "yes",
      inactive: "no",
      format: (complete) => ({ pruning: !complete }),
    }),
    // Log //
    constant({
      type: "select",
      name: "value",
      message: ["Select AppMap logging level:"],
      initial: 1,
      choices: [
        {
          title: "Debug",
          value: { log: "debug" },
        },
        {
          title: "Info",
          value: { log: "info" },
        },
        {
          title: "Warning",
          value: { log: "warning" },
        },
        {
          title: "Error",
          value: { log: "error" },
        },
        {
          title: "Off",
          value: { log: "off" },
        },
      ],
    }),
  ];

  const questionConfigAsync = async () => {
    const config = {};
    for (const createPrompt of questions) {
      const prompt = createPrompt(config);
      if (prompt !== null) {
        const { message, ...rest } = prompt;
        const result = await prompts({
          message:
            message.length === 1 ? message[0] : message.join("\n  ") + "\n",
          ...rest,
        });
        if (hasOwnProperty(result, "value")) {
          assign(config, result.value);
        } else {
          break;
        }
      }
    }
    return config;
  };

  return { questionConfigAsync };
};
