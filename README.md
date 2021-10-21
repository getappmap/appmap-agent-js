# Get started with appmap-agent-js

`appmap-agent-js` is a JavaScript recording agent for the [AppMap](https://appland.org) framework.

Table of contents:
- [Get started with appmap-agent-js](#get-started-with-appmap-agent-js)
  - [How it works](#how-it-works)
  - [Installation and setup](#installation-and-setup)
    - [Requirements](#requirements)
    - [Installation](#installation)
    - [Initial configuration](#initial-configuration)
      - [Know before you start](#know-before-you-start)
      - [Start the setup command](#start-the-setup-command)
      - [To set up recording mocha test cases:](#to-set-up-recording-mocha-test-cases)
      - [To set up remote recording:](#to-set-up-remote-recording)
  - [Recording AppMaps](#recording-appmaps)
    - [To record mocha test cases:](#to-record-mocha-test-cases)
    - [To record running node processes with remote recording:](#to-record-running-node-processes-with-remote-recording)
  - [Viewing AppMaps](#viewing-appmaps)
- [Reference](#reference)
  - [Automated Recording](#automated-recording)
    - [Scenario](#scenario)
    - [CLI](#cli)
    - [Local Recording](#local-recording)
    - [Remote Recording](#remote-recording)
  - [Manual Recording](#manual-recording)
  - [Configuration](#configuration)
    - [Prelude: Specifier Format](#prelude-specifier-format)
    - [Automated Recording Configuration Fields](#automated-recording-configuration-fields)
    - [Common Options](#common-options)
  - [Application Representation](#application-representation)
    - [Classmap](#classmap)
    - [Qualified Name](#qualified-name)


## How it works
 
`appmap-agent-js` records AppMaps from node processes when they are run. There are several strategies for recording AppMaps:

1. recording `mocha` test cases when they are run
2. recording the application processes when the application is run:
    1. recording complete processes, start-to-finish
    2. recording selected time spans using start/stop controls provided by the AppMap agent
        - with HTTP calls to the agent that start/stop the recording remotely
        - with programmatic API that start/stop the recording locally in the application code

To record application processes or tests when they run, they tests or processes have to be started by the AppMap agent,
as described in the next steps.


## Installation and setup

### Requirements

* unix-like os, tested on Linux and macOS; Windows is currently not supported
* node 14, 16, 17, or 18
* use of express.js is highly recommended - some HTTP mapping features are only available with express 
* git is highly recommended 
* mocha >= 8.0.0 when recording AppMaps from mocha test cases (earlier versions do not support required root hooks)


### Installation

To install the agent in your node project, run `npm install` in its root folder (where `package.json` is located): 
```sh
npm install @appland/appmap-agent-js
```


### Initial configuration

The AppMap agent requires a valid configuration in an `appmap.yml` file to run. This file sets up the recording
strategies and configuration details for your project, such as
- the name of the application
- the command that starts the application or that runs the tests
- selected recording method and its configuration
- the output directory


#### Know before you start

You should know these details before you begin:
- what command starts the application, example: `node app.js`
- does the application have `mocha` tests? If so, what command runs the tests? example: `npx mocha --recursive test/**/*.ts`
- the HTTP port of the application (typical values are 3000, 4000, 8000)
- does the application use the `mysql`, `pg` or `sqlite3` package? Check the dependencies in `package.json`.


#### Start the setup command

We recommend you start with a setup command that creates the initial configuration in `appmap.yml`.  
Run this command in the root folder of your project:

```sh
npx appmap-agent-js setup
```
You should see a prompt similar to this:
```
✔ Supported operating system detected: darwin
✔ Supported node detected: v14.17.6.
? Run AppMap configuration wizard for this project? › no / yes
```

Answer `yes` to continue:

1. Enter the application name. It will be used to identify the app in recorded AppMaps
2. Select the recording method. You have several choices:
    1. if your application has `mocha` tests, we recommend to record `mocha` test cases
    2. if you don't have good tests or when troubleshooting a code issue, we recommend remote recording
    3. for small and short-lived programs, recording their processes end-to-finish is a simple viable option, but it can lead to large and noisy AppMaps for more complex applications
    4. programmatic recording is a good option when you need a fine control over what code gets recorded when it runs. You will nedd to add your own start/stop recording logic to the recorded application code.

We recommend recording test cases or remote recording when starting with AppMaps. 

Based on the recording method selected, you will be asked you to enter additional application and configuration details.

---

#### To set up recording mocha test cases:

1. Pick the `Record mocha test cases when they run` recording method
2. Enter the command that runs your tests, example: `npx mocha --recursive test/**/*.ts`
3. Press Enter to use the default output directory `tmp/appmap`
4. Select the recording scope. Add a database **if and only if** the required database driver package exists as a dependency in the `package.json` file of your project. If you aren't sure, leave the database commands unchecked for now.
5. Select the ordering of events. We recommend `Causal` for better user experience when viewing the AppMaps, at the cost of a slight performance penalty when the AppMaps are recorded.
6. Select `no` for `keep all imported sources in class maps`
7. Pick the logging level, `Info` is the recommended default level.

The setup command now creates a new `appmap.yml` file in the current directory and runs validation checks. You should see output similar to this:
```sh
✔ Supported operating system detected: darwin
✔ Supported node detected: v14.17.6.
✔ Run AppMap configuration wizard for this project? … no / yes
✔ Enter application name: … JuiceShop
✔ Select recording method: › Record mocha test cases when they run
✔ Enter command to start the recorded application: (example: 'node path/to/main.js argv0 argv1') … npx mocha
✔ Enter AppMap output directory: (default: `tmp/appmap`) … tmp/appmap
✔ Select recording scope - what events get recorded: › Functions located in CommonJS modules, Functions located in native modules, HTTP requests
✔ Select ordering of events in recorded AppMaps: › Causal
✔ Keep imported sources that were not executed during recording in class maps? (default: yes, no for mocha tests) … no / yes
✔ Select AppMap logging level: › Info
✔ appmap.yml created.
✔ appmap.yml file is a valid YAML file.
✔ appmap.yml file is valid.
✔ The appmap-agent-js module is available.
✔ Current directory looks like a git repository.
✔ package.json file exists.
```

Your `appmap.yml` should be similar to this:
```yaml
app: MyApp
recorder: mocha
mode: local
scenario: my-scenario
scenarios:
  my-scenario: npx mocha
output:
  directory: tmp/appmap
hooks:
  esm: true
  cjs: true
  http: true
  mysql: false
  pg: false
  sqlite3: false
ordering: causal
pruning: true
log: info
```

The initial setup is now complete, proceed to [recording AppMaps](#recording-appmaps). 

---

#### To set up remote recording:

1. Pick the `Use remote recording to record node processes` recording method
2. Enter the command that runs your tests, example: `node app.js`
3. Enter the HTTP port of the application. Leave blank to use the fallback port for remote recording control.
4. Enter the fallback port for remote recording control. We recommend that you pick a free port close to the app HTTP port, i.e. 3003.
5. Select the recording scope. Confirm the default selection or add a database if and only if the required database driver package exists as a dependency in `package.json`. If you aren't sure, leave the database commands unchecked for now.
6. Select the ordering of events. We recommend `Causal` for better user experience when viewing the AppMaps, at the cost of a slight performance penalty when the AppMaps are recorded.
7. Select `yes` for `keep all imported sources in class maps`.
8. Pick the logging level, `Info` is the recommended default level.

The setup script now creates a new `appmap.yml` file in the current directory and runs validation checks. You should see an output similar to this:

```sh
✔ Supported operating system detected: darwin
✔ Supported node detected: v14.17.6.
✔ Run AppMap configuration wizard for this project? … no / yes
✔ Enter application name: … Demo
✔ Select recording method: › Use remote recording to record node processes
✔ Enter command to start the recorded application: (example: 'node path/to/main.js argv0 argv1') … node app.js
✔ Enter HTTP port of the recorded application (typical values: 3000, 4000, 8000):
  The agent will be expecting the app to be accepting HTTP requests on this port.
  Leave blank to not use the application port for remote recording control.
 …
✔ Enter fallback port for remote recording control: (1..65535, 0 for auto-assigned) … 3003
✔ Select recording scope - what events get recorded: › Functions located in CommonJS modules, Functions located in native modules, HTTP requests
✔ Select ordering of events in recorded AppMaps: › Causal
✔ Keep imported sources that were not executed during recording in class maps? (default: yes, no for mocha tests) … no / yes
✔ Select AppMap logging level: › Info
✔ appmap.yml created.
✔ appmap.yml file is a valid YAML file.
✔ appmap.yml file is valid.
✔ The appmap-agent-js module is available.
✔ Current directory looks like a git repository.
✔ package.json file exists.
```

Your `appmap.yml` should be similar to this:
```yaml
app: MyApp
recorder: remote
mode: remote
scenario: my-scenario
scenarios:
  my-scenario: node app.js
intercept-track-port: 3000
track-port: 3003
hooks:
  esm: true
  cjs: true
  http: true
  mysql: false
  pg: false
  sqlite3: false
ordering: causal
pruning: false
log: info
```

The initial setup is now complete, proceed to [recording AppMaps](#recording-appmaps). 

---

## Recording AppMaps

Once `appmap.yml` is configured, you are ready to record AppMaps. 


### To record mocha test cases:

1. Make sure that the rests run prior to recording AppMaps
2. Run the `appmap-agent-js`:
```sh
npx appmap-agent-js
```
1. `appmap-agent-js` will use the command entered during setup to run the tests and record AppMaps
2. When the tests complete, the AppMaps are stored in the output directory entered during configuration (`tmp/appmap`)

---

### To record running node processes with remote recording:

1. Shut down the application if already running
2. Run the `appmap-agent-js`:
```sh
npx appmap-agent-js
```
3. The agent will use the command entered during setup to start the application. When started, use [a remote
   recording control of your preference](https://appland.com/docs/reference/remote-recording) to start the recording
   using the port of your choice when connecting to the agent. 
4. Interact with your application or service to exercise code to be recorded
5. Stop the recording and save the new AppMap to disk.

---

## Viewing AppMaps

Follow the documentation for your IDE:
- [AppMap for JetBrains](https://appland.com/docs/reference/jetbrains)
- [AppMap for VSCode](https://appland.com/docs/reference/vscode)



<!--
TODO: sql libraries requirements
* `--experimental-loader` requires `>= nodev9.0.0` 
* `NODE_OPTIONS` requires `>= nodev8.0.0`
* `--require` requires `>= nodev1.6.0`
-->

---

&nbsp;

# Reference

## Automated Recording

The agent provides a CLI to spawn and record node processes.
By default, the agent will look for a configuration file at `./appmap.yml`.
The configuration format is detailed [here](#configuration).

### Scenario

The information to spawn a process are provided to the agent as a format called *scenario*.
The most expressive option to provide scenario to the agent is via the `scenarios` configuration field.

```yml
scenarios:
  my-scenario: [node main.mjs argv0 argv1]
```

```sh
npx appmap-agent-js --scenario my-scenario
```

Alternatively, a scenario can be provided as the positional arguments of the agent command:

```sh
npx appmap-agent-js -- node main.mjs argv0 argv1
```

There exists two different scenario formats which are inspired from [`child_process`](https://nodejs.org/api/child_process.html).
The `fork` format spawns a node process and supports file globbing.
The `spawn` format spawns any kind of process and does not support file globbing.
Another important difference between the two formats is that the `spawn` format will also record grand-child processes which is not the case for the `fork` format.
This is because, under the hood, the `fork` format uses node command line arguments while the `spawn` format uses environment variables.

```yml
scenarios:
  # Spawn Command
  spawn-command: "node main.mjs argv0 argv1"
  spawn-command-explicit:
    type: spawn
    exec: /bin/sh
    argv: ["-c", "node main.mjs argv0 argv1"]
  # Spawn Parsed Command
  spawn-parsed-command: [node main.mjs argv0 argv1]
  spawn-parsed-command-explicit:
    type: spawn
    exec: node
    argv: [main.mjs, argv0, argv1]
  # Fork without globbing
  fork:
    type: fork
    globbing: false
    exec: main.mjs
    argv: [argv0, argv1]
  # Fork with globbing
  fork-globbing:
    type: fork
    exec: test/**/*.mjs
    argv: [argv0, argv1]
```

Note that scenarios can also provide their own configuration object:

```yaml
name: default-appmap-name
scenarios:
  my-scenario:
    type: fork
    exec: main.mjs
    configuration:
      name: my-scenario-appmap-name
```

Note that the configuration object of scenarios cannot overwrite the fields `output.target` and `output.directory`.

### CLI

* *Positional arguments* The parsed elements of a command.
* *Named arguments* Any configuration field.
  This takes precedence over the options from the configuration file.
  For instance:
  ```sh
  npx appmap-agent-js --name my-appmap-name --app my-app-name
  ```
* *Environment variables*
    * `APPMAP_CONFIGURATION_PATH`: path to the configuration file, default: `./appmap.yml`.
    * `APPMAP_REPOSITORY_DIRECTORY`: directory to the project's home directory, default: `.`.
    Requirements:
      * *[mandatory]* Access to the `@appland/appmap-agent-js` npm module.
      * *[preferred]* Be a git repository.
      * *[preferred]* Contain a valid `package.json` file.

### Local Recording

The first option to generate appmaps is called local recording.
It involves indicating the agent when to generate appmaps and where to write them:

```yaml
mode: local
# When to generate appmaps:
recorder: process # or mocha
# Where to write appmaps:
output:
  directory: tmp/appmap
```

The `recorder` configuration field supports two strategies to generate appmaps:

* `"process"` (default): Generate a single appmap which spans over the entire lifetime of the process.
* `"mocha"`: Generate an appmap for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).
  It is only available in the `spawn` format and expects the parsed command to start with either `mocha` or `npx mocha`.
  Note that mocha run the entire test suite within a single node process.
  Hence all the exercised parts of the application will probably end up being included into every generated appmap.
  The `pruning` configuration option can be used to solve this issue.
  If enabled, the appmap will be stripped of the elements of the classmap that did not cause any function applications.
  Example of configuration file:
  ```yaml
  mode: file
  pruning: true
  scenarios:
    mocha:
      type: spawn
      exec: mocha
      configuration:
        recorder: mocha
    npx-mocha:
      type: spawn
      exec: npx
      configuration:
        recorder: mocha
        processes:
          regexp: npx
          enabled: false
      argv: [mocha]
  ```

### Remote Recording

The second option to generate appmaps is on-demand via HTTP requests.
The remote recording web API is documented [here](https://appland.com/docs/reference/remote-recording).

```yaml
mode: remote
track-port: 8001
intercept-track-port: 8000
```

Remote recording requests can be delivered to two possible end points:

|                         | Configuration Field    | Routing              | Comment                                                                                |
|-------------------------|------------------------|----------------------|----------------------------------------------------------------------------------------|
| Dedicated backend port, a.k.a. the fallback port  | `track-port`           | `/{session}/{track}` | If `session` is `"_appmap"` then the (assumed) single active session will be selected. |
| Intercepted HTTP port of the application | `intercept-track-port` | `/_appmap/{track}`   | Will not be active until the application deploy an HTTP server on that port.           |

<!-- ### Mode

The functionalities of the agent is split in two main parts.
The *backend* buffers the trace and eventually post-process it and stores it.
The *frontend* contains all the other functionalities of the agent which should always be located on the recorded process -- eg: intercepting http traffic.
The `mode` configuration option defines where the backend is located:
* `"local"`: the backend is executed by the recorded process.
* `"remote"`: the backend is executed by another node process. 

Advantages of the remote mode over the local mode:
* Appmap storage will always happens, regardless of how the recorded process is terminated.
  For instance, in the local mode, killing the recorded process with `SIGKILL` or performing `process.removeAllListeners("exit")` will preclude appmap storage.
* The backend process manages multiple recorded processes and prevent accidental overwriting of appmap files.
* Lower memory footprint of the agent on the recorded process because it contains less functionalities and no trace. -->

## Manual Recording

The agent also provides an API to manually record the node process in which it is imported.

```js
import {createAppmap} from "@appland/appmap-agent-js";
// NB: Only a single concurrent appmap is allowed per process
const appmap = createAppmap(
  repository_directory,    // default: process.cwd()
  configuration,           // default: {}
  configuration_directory, // default: null
);
// NB: An appmap can create multiple (concurrent) tracks
const track = "my-identifier";
appmap.start(track, {
  app: "my-app-name",
  name: "my-appmap-name",
  pruning: true,
  recording: {
    defined-class: "defined-class",
    method-id: "method-id",
  },
});
appmap.recordScript(
  "(function main () { return 123; } ());",
  "path/to/main.js",
);
const trace = appmap.stop(track, {
  status: 0,
  errors: [] 
});
console.log(JSON.stringify(trace, null, 2));
```

## Configuration

The actual format requirements for configuration can be found as a json-schema [here](build/schema/schema.yml).

### Prelude: Specifier Format

The agent filter files based on a format called `Specifier`.
A specifier can be any of:
* `<RegexpSecifier>` Filter files based on a regular expression.
    * `regexp <string>` The regular expression's source.
    * `flags <string>` The regular expression's flags. *Default*: `"u"`.
* `<GlobSpecifier>` Filter files based on a glob expression
    * `glob <string>` The glob expression
* `<PathSpecifier>` Filter files based on a path
    * `path <string>` Path to a file or a directory (without trailing `/`).
    * `recursive <boolean>` Indicates whether to whitelist files within nested directories. *Default*: `true`.
* `<DistSpecifier>` Filter files based on a npm package name.
    * `dist <string>` Relative path that starts with a npm package name. For instance: `"package/lib"`.
    * `recursive <boolean>`: indicates whether to whitelist files within nested directories. *Default*: `true`.
    * `external <boolean>` Indicates whether to whitelist dependencies outside of the repository. *Default*: `false`.

<!-- * `hidden-identifier <string>` The prefix of hidden variables used by the agent. The instrumentation will fail if variables from the program under recording starts with this prefix. *Default*: `"APPMAP"`.
* `function-name-placeholder <string>` The placeholder name for classmap function elements. *Default* `"()"`. 
* `mode: "local" | "remote"` Defines whether the backend should be executed on the recorded process or on a remote process. *Default*: `"local"` for the API and `"remote"` for the CLI.
* `protocol "tcp" | "http1" | "http2"` Defines the communication protocol between frontend and backend. Only applicable in remote mode. `"tcp"` refers to a simple messaging protocol directly built on top of tcp and is the fastest option. *Default*: `"tcp"`.
* `port <number> | <string>` Defines the communication port between frontend and backend. Only applicable in remote mode. A string indicates a path to a unix domain socket which is faster. *Default*: `0` which will use a random available port.
* `validate <boolean> | <object>` Validation options which are useful to debug the agent.
  * `<boolean>` Shorthand, `true` is the same as `{message: true, appmap:true}` and `false` is the same as `{message:true, appmap:true}`.
  * `<object>`
      * `message <boolean>` Indicates whether to validate trace elements as they are buffered. This is useful to help diagnose the root cause of some bugs. *Default* `false`.
      * `appmap <boolean>` Indicates whether to validate the appmap before writting it to a file. *Default* `false`. -->

### Automated Recording Configuration Fields

* `mode "local" | "remote"`
* `recorder "process" | "remote"` Defines the main algorithm used for recording. *Default* `"process"`.
    * `"process"` Generate a single appmap which spans over the entire lifetime of the process.
    * `"mocha"` Generate an appmap for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).
* `track-port <number> | null`: Port in the backend process for serving remote recording HTTP requests. *Default*: `0` A random port will be used.
* `intercept-track-port <number> | null`: Port in the frontend process for intercepting remote recording HTTP requests. *Default*: `null` No interception.
* `processes <boolean> | <string> | <EnabledSpecifier> | <EnabledSpecifier[]>` Whitelist files to decide whether a node process should be instrumented based on the path of its main module. An `EnabledSpecifier` can be any of
    * `<boolean>` Shorthand, `true` is the same as `{regexp:"^", enabled:true}` and `false` is the same as `{regexp:"^", enabled:false}`.
    * `<string>` Shorthand, `"test/**/*.mjs"` is the same as `{glob:"test/**/*.mjs", enabled:true}`.
    * `<object>`
        * `enabled <boolean>` Indicates whether whitelisted files are enabled or not. *Default*: `true`.
        * `... <Specifier>` Extends from any specifier format. 
  *Default*: `[]` -- ie: the agent will be enabled for every process whose entry script resides in the repository directory.
* `scenario <string>` A regular expression to select scenarios for execution. *Default*: `"anonymous"` (the name of the scenario provided by command line argument).
* `scenarios <object>` An object whose values are either a single scenario or a list of scenarios. A scenario can be any of:
      * `<string>` Command which gets converted in the `spawn` format. For instance: `"exec argv0"` is the same as `{type: "spawn", exec: "/bin/sh", argv: ["-c", "exec argv0"]}`.
      * `<string[]>` Parsed command which gets converted in the `spawn` format. For instance: `["exec", "argv0"]` is the same as `{type: "spawn", exec: "exec", argv: ["argv0"]}`.
      * `<SpawnScenario>` The spawn scenario format which is inspired from [child_process#spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options):
          * `type "spawn"`
          * `exec <string>` Executable to run, paths should be relative to `options.cwd`.
          * `argv <string[]>` List of command line arguments to pass to the executable.
          * `options <object>` Options object
              * `cwd <string>` Current working directory of the child process. *Default*: the directory of the configuration file.
              * `env <object>` Environment variables. Note that Unlike for the [child_process#spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options), the environment variables from the parent process will always be included.
        *Default*: `{}` -- ie: the environment variables from the parent process.
              * `stdio <string> | <string[]>` Stdio configuration, only `"ignore"` and `"inherit"` are supported.
              * `encoding "utf8" | "utf16le" | "latin1"` Encoding of all the child's stdio streams.
              * `timeout <number>` The maximum number of millisecond the child process is allowed to run before being killed. *Default*: `0` (no timeout).
              * `killSignal <string>` The signal used to kill the child process when it runs out of time. *Default*: `"SIGTERM"`.
          * `configuration <Configuration>`: Extension of the parent configuration.
          *Default*: `{}` -- ie: reuse the parent configuration.
      * `<ForkScenario>` The spawn scenario format which is inspired from [child_process#fork][https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options]
          * `type "fork"`
          * `globbing <boolean>` Indicates whether the `exec` property should be interpreted as a glob or a path. *Default*: `true`.
          * `exec <string>` Path to the main module relative to `options.cwd`.
          * `argv <string[]>` List of command line arguments to pass to the main module.
          * `options <Object>`
              * `execPath` Path to a node executable
              * `execArgv` List of command line arguments to pass to the node executable.
              * `... <SpawnScenario.options>` Any option from the `spawn` format is also supported.
          * `configuration <Configuration>` Extension of the parent configuration. *Default*: `{}` -- ie: reuse the parent configuration.
* `output <string> | <object>` Options to store appmap files.
    * `null` Shorthand for `{target:"http"}`.
    * `<string>` Shorthand, `"tmp/appmap"` is the same as `{target: "file", directory: "tmp/appmap"}`.
    * `<object>`
        * `target "file" | "http"` Either write appmaps in files or serve through HTTP.
        * `directory <string>` Directory to write appmap files.
        * `basename null | <string>` Basename of the future appmap file. Indexing will be appended to prevent accidental overwriting of appmap files within a single run. *Default*: `null` the agent will look at the `name` configuration field, if it is `null` as well, `"anonymous"` will be used.
        * `extension <string>` Extension to append after the basename. *Default*: `".appmap.json"`.

### Common Options

* `log "debug" | "info" | "warning" | "error" | "off"` Usual log levels. *Default*: `"info"`.
* `packages <PackageSpecifier> | <PackageSpecifier[]>` File filtering for instrumentation. A `PackageSpecifier` can be any of:
    * `<string>`: Glob shorthand, `"lib/**/*.js"` is the same as `{glob: "lib/**/*.js"}`.
    * `<object>`
        * `enabled <boolean>` Indicates whether the filtered file should be instrumented or not. *Default*: `true`.
        * `shallow <boolean>` Indicates whether the filtered file should 
        * `exclude <string[]>` List of [qualified name](#qualified-name) to exclude from instrumentation. Regular expression are supported.
        * `... <Specifier>` Extends from any specifier format.
* `exclude <string[]>` List of [qualified name](#qualified-name) to always exclude from instrumentation. Regular expression are supported.
* `source <boolean>` Indicates whether to include source code in the appmap file. *Default* `false`. 
* `hooks <object>` Flags controlling what the agent intercepts.
    * `cjs <boolean>` Indicates whether commonjs modules should be instrumented to record function applications. *Default*: `true`.
    * `esm <boolean>` Indicates whether native modules should be instrumented to record function applications. *Default*: `true` for the CLI and `false` for the API.
    * `group <boolean>` Indicates whether asynchronous resources should be monitored to infer causality link between events. This provides more accurate appmaps but comes at the price of performance overhead. *Default*: `true`.
    * `http <boolean>` Indicates whether [`http`](https://nodejs.org/api/http.html) should be monkey patched to monitor http traffic. *Default*: `true`.
    * `mysql <boolean>` Indicates whether [`mysql`](https://www.npmjs.com/package/mysql) should be monkey patched to monitor sql queries. The agent will crash if the `mysql` package is not available. *Default*: `false`.
    * `pg <boolean>` Indicates whether [`pg`](https://www.npmjs.com/pg) should be monkey patched to monitor sql queries. The agent will crash if the `pg` package is not available. *Default*: `false`.
    * `sqlite3 <boolean>` Indicates whether [`sqlite3`](https://www.npmjs.com/sqlite3) should be monkey patched to monitor sql queries. The agent will crash if the `sqlite3` package is not available. *Default*: `false`.
* `ordering "chronological" | "causal"` 
* `app null | <string>` Name of the recorded application. *Default*: `name` value found in `package.json` (`null` if `package.json` is missing).
* `name null | <string>` Name of the appmap. *Default*: `null`.
* `pruning <boolean>` Remove elements of the classmap which did not trigger any function application event. *Default*: `false`.
* `serialization <string> | <object>` Serialization options.
    * `<string>` Shorthand, `"toString"` is the same as `{method: "toString"}`.
    * `<object>`
        * `method "toString" | "Object.prototype.toString"`: the name of the algorithm that should be used to print object runtime values (not `null` nor functions). `"toString"` will use the printing method provided by the object. Note that there is no guarantee that this method is side-effect free. By opposition `"Object.prototype.toString"` is always guaranteed to be side-effect free but provide a very vague description of the object. For instance: `/foo/g.toString()` is `"/foo/g"` whereas `Object.prototype.toString.call(/foo/g)` is `"[object RegExp]"`. *Default* `"toString"`.
        * `include-constructor-name <boolean>`: indicates whether or not to fetch the constructor name of runtime values. Fetching constructor name for every intercepted runtime value can add up to some performance overhead. Also, fetching constructor name can trigger code from the application being recorded if it uses [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). *Default* `true`.
        * `maximum-length <number>` the maximum length of the string representation of runtime values. *Default* `96`.

## Application Representation

*Warning bumpy road ahead*

### Classmap

The appmap framework represent an application as a tree structure called *classmap*.
The base of a classmap tree mirrors the file structure of the recorded application with nested `package` classmap nodes.
Within a file, some [estree](https://github.com/estree/estree) nodes are selected to be represented as `class` classmap nodes based on their type.
The name of these classmap nodes are based on an algorithm that resembles the [naming algorithm of functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name).
If a node has no such name, a unique indexed name will be provided. Estree nodes of type `ObjectExpression`, `ClassExpression`, or `ClassDeclaration` are qualified as *class-like* and are directly represented by a `class` node.
Estree node of type: `ArrowFunctionExpression`, `FunctionExpresssion`, and `FunctionDeclaration` are qualified as *function-like* and are represented by a `class` classmap node which contains a `function` classmap node as first child.
This circumvoluted representation is required because the [appmap specification](https://github.com/applandinc/appmap) does not allow `function` node to contain children. Other estree nodes are not represented in the classmap.

Example:

```js
// main.js
function main () {
  class Class {}
}
```

```yaml
- type: package
  name: main.js
  children:
  - type: class
    name: main
    children:
    - type: function
      name: "()" 
    - type: class
      name: Class
      children: []
```

### Qualified Name

Excluding some parts of the files for instrumentation is based on *qualified name*.
A qualified name is based on whether an estree node resides at the `value` field of a `Property` or a `MethodDefinition`.
If it is the case the node is said to be *bound*, else it is said to be *free*.
The qualified name of a *bound* estree node is the combination of the name of its parent classmap node and the name if its classmap node.
The qualified name of a free estree node is the same as the name of its classmap name.

Examples:

* `function f () {}` is `f`
* `const o = { f () {} }` is `o.f`
* `class c { f () {} }` is `c.f`
* `class c { static () {} }` is `c#f`


<!-- ### Class-like Nodes

These nodes are the JavaScript (most common) means to implement classes.
As expected, they are each represented by a `class` code object.
There are three types of class-like nodes:

* *Class Declaration*
```js
class Counter {
  constructor () { this.state = 0; }
  increment () { this.state++; }
}
const counter = new Counter();
```
* *Class Expression*
```js
const Counter = class {
  constructor () { this.state = 0; }
  increment () { this.state++; }
};
const counter = new Counter();
```
* *Object Expression*
  In javascript, object literals are used to implement multiple concepts.
  The most common usages are:
  * Singleton: an object literal can be used to implement a class with a single instance.
    For instance:
    ```js
    const counter = {
      state: 0,
      increment () { this.state++; }
    };
    ```
  * Prototype: an object can be used to embed the sharable fields / methods of a class.
    For instance:
    ```js
    const prototype = {
      increment () { this.state++; }
    };
    const counter = {
      __proto__: prototype,
      state: 0
    };
    ```
  * Mapping: an object can be used to map strings / symbols to values of any type.
    In principle, this usage should prevent the object literal from appearing in the class map.
    Unfortunately, there is no general solution to tell this usage apart from the others.

The `class` code object of class-like node will contain the code object of all the eligible nodes that occur as its property value.
In that case, we say that the node is *bound* to the class-like node.

```js
const isBound (node) => (
  (
    (
      node.parent.type === "MethodDefinition" &&
      node.parent.parent.type === "ClassBody") ||
    (
      node.parent.type === "Property" &&
      node.parent.parent.type === "ObjectExpression")) &&
  node.parent.value === node
);
```

Bound nodes will be named according to the following algorithm:

```js
const getBoundName = (node) => {
  node = node.parent;
  if (node.type === "MethodDefinition") {
    if (node.kind === "constructor") {
      console.assert(!node.static);
      return "constructor";
    }
    if (node.kind === "method") {
      return `${node.static ? "static " : ""}${getKeyName(node)}`;
    }
    console.assert(node.kind === "get" || node.kind === "set");
    return `${node.static ? "static " : ""}${node.kind} ${getKeyName(node)}`;
  }
  if (node.type === "Property") {
    if (node.kind === "init") {
      return getKeyName(node);
    }
    console.assert(node.kind === "get" || node.kind === "set");
    return `${node.kind} ${getKeyName(node)}`;
  }
  console.assert(false);
};

const getKeyName = (node) => {
  console.assert(node.type === "MethodDefinition" || node.type === "Property");
  if (node.computed) {
    return "[#computed]";
  }
  if (node.key.type === "Identifier") {
    return node.key.name;
  }
  if (node.key.type === "Literal") {
    console.assert(typeof node.key.value === "string");
    return JSON.stringify(node.key.value);
  }
  console.assert(false);
};
```

For instance:
* `var o = { f: function g () {} });`: `f`
* `({ "f": function g () {} });`: `"f"`
* `({ [f]: function g () {} });`: `[#computed]`
* `({ m () {} })`: `m`
* `({ get x () {} });`: `get x`
* `(class { constructor () {} });`: `constructor`
* `(class { m () {} });`: `m`
* `(class { get x () {} });`: `get x`
* `(class { static m () {} });`: `static m`
* `(class { static get x () {} });`: `static get x`

### Function-like Nodes

These nodes are the JavaScript (most common) means to implement functions.
They are each represented by a `class` code object which is guaranteed to includes one and only one `function` code object named `()`.
This trick is necessary because `function` code objects are not allowed to contain children in the appmap specification whereas nesting functions and classes inside other functions is one of the key aspect of JavaScript.
There are three types of function-like nodes:
* *Function Declaration*: `function f () {};`
* *Function Expression*: `const f = function () {};`
* *Arrow Function Expression*: `const a = () => {};`

The `class` code object of a function-like node will contain all the eligible nodes that are not bound to a class-like node.
Also, they will be named based on the ECMAScript static naming algorithm and prepended by the `@` character.
If the node has no static name, `@anonymous` is provided.
For instance:
* Declaration:
  * `function f () {}`: `@f`
  * `class c () {}`: `@c`
  * `export default function () {}`: `@default`
  * `export default class {}`: `@default`
* Simple Variable Initializer:
  * `var f = function g () {};`: `@g`
  * `var c = class d () {};`: `@d`
  * `var f = function () {};`: `@f`
  * `var c = class () {};`: `@c`
  * `var o = {}`: `@o`
  * `var a = () => {}`: `@a`
* Simple Right-Hand Side:
  * `(f = function g () {});`: `@g`
  * `(c = class d () {})`: `@d`
  * `(f = function () {});`: `@f`
  * `(c = class () {})`: `@c`
  * `(o = {})`: `@o`
  * `(a = () => {})`: `@a`
* Anonymous:
  * `var {o} = {{}}`: `@anonymous`
  * `(o += {});`: `@anonymous`
  * `o.f = function () {}`: `@anonymous` -->
