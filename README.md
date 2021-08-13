# appmap-agent-js

JavaScript agent for the AppMap framework.

To install:
```sh
npm install @appland/appmap-agent-js
```

To run:
```sh
echo '{enabled:true, packages:"**/*"}' > appmap.yml
npx appmap-agent-js -- main.mjs argv0 argv1
cat tmp/appmap/main.appmap.json
```

## Requirements

* unix-like os
* git
* any up-to-date major node release that is still maintained -- ie: 12, 14, 15, and 16
* [mocha recorder only]: mocha >= 8.0.0 (because of root hooks)

<!-- * `--experimental-loader` requires `>= nodev9.0.0` 
* `NODE_OPTIONS` requires `>= nodev8.0.0`
* `--require` requires `>= nodev1.6.0` -->

## Automated Recording

The agent provides a CLI to automatically record node processes.
By default, the agent will look for configuration in a file at `./appmap.yml`.
The configuration format is detailed [here](#configuration).

### Scenario

The information to spawn a process are provided to the agent as a format called *scenario*.
Scenarios should be provided to the agent via a configuration file which by default at `./appmap.yml`.

```yml
scenarios:
  my-scenario: [node main.mjs argv0 argv1]
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
    exec: main.mjs
    argv: [argv0, argv1]
  # Fork with globbing
  fork-globbing:
    type: fork
    globbing: true
    exec: test/**/*.mjs
```

Note that scenarios can also provide their own configuration options:

```yaml
output:
  filename: default-filename
scenarios:
  my-scenario:
    type: fork
    exec: main.mjs
    configuration:
      output:
        filename: my-scenario-filename
```

### CLI

* Positional arguments: the parsed elements of a command
* Named arguments: any configuration option.
  This takes precedence over the options from the configuration file.
  For instance:
  ```sh
  npx appmap-agent-js --package 'lib/*.mjs' --package 'dist/*.mjs'
  ```
* Environment variables:
  * `APPMAP_CONFIGURATION_PATH`: path to the configuration file, default: `./appmap.yml`.
  * `APPMAP_REPOSITORY_DIRECTORY`: directory to the project's home directory, default: `.`.
    Requirements:
    * *mandatory*: access to the `@appland/appmap-agent-js` npm module.
    * *preferred*: be a git repository.
    * *preferred*: contain a valid `package.json` file.

### Recorder

The `recorder` configuration option defines the main algorithm used for recording:

* `"process"` (default): Generate a single appmap which spans over the entire lifetime of the process.
* `"mocha"`: Generate an appmap for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).
  It is only available in the `spawn` format and expects the parsed command to start with either `mocha` or `npx mocha`.
  Note that mocha run the entire test suite within a single node process.
  Hence all the exercised parts of the application will probably end up being included into every generated appmap.
  The `pruning` configuration option can be used to solve this issue.
  If enabled, the appmap will be stripped of the elements of the classmap that did not cause any function applications.
  Example of configuration file:
  ```yaml
  packages: "lib/**/*.mjs"
  pruning: true
  scenarios:
    global-mocha:
      type: spawn
      recorder: mocha
      exec: mocha
      configuration:
        enabled: true
    local-mocha:
      type: spawn
      recorder: mocha
      exec: npx
      configuration:
        # prevent recording of the npx command
        enabled:
          dist: "mocha"
      argv: [mocha]
  ```

### Mode

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
* Lower memory footprint of the agent on the recorded process because it contains less functionalities and no trace.

## Manual Recording

The agent also provides an API to manually record the node process in which it is imported.

```js
import {createAppmap} from "@appland/appmap-agent-js";
// Prepare the process for recording
// NB: Only a single concurrent appmap is allowed per process
const appmap = createAppmap(configuration);
// Start recording events
// NB: An appmap can create multiple (concurrent) recordings
const recording = appmap.start({
  name, // name if the appmap
  filename, // filename to write the appmap
});
// Stop recording events
recording.pause();
// Restart recording events
recording.play();
// Terminate the recording and write the appmap file
recording.stop();
```

The configuration format is detailed [here](#configuration).
The API offers the same functionalities as the CLI safe for the following caveats:
* Only the `"inline"` mode is supported.
* To enable native module instrumentation in the API, the node process should be started with the [`--experimental-loader`](https://nodejs.org/api/cli.html#cli_experimental_loader_module) node CLI option:
  ```
  node --experimental-loader=./node_modules/@appland/appmap-agent-js/lib/loader.mjs main.mjs argv0 argv1
  ``` 
  We are aware that this is limiting but we are bound to node's reflection capabilities.

## Configuration

The actual format requirements for configuration can be found as a json-schema [here](build/schema/schema.yml).

### Prelude: Specifier Format

The agent whitelist files based on a format called `Specifier`.
A specifier can be any of:
  * `<RegexpSecifier>` Whitelist files based on a regular expression.
    * `regexp <string>` The regular expression's source.
    * `flags <string>` The regular expression's flags. *Default*: `"u"`.
  * `<GlobSpecifier>` Whitelist files based on a glob expression
    * `glob <string>` The glob expression
  * `<PathSpecifier>` Whitelist files based on a path
    * `path <string>` Path to a file or a directory (without trailing `/`).
    * `recursive <boolean>` Indicates whether to whitelist files within nested directories. *Default*: `true`.
  * `<DistSpecifier>` Whitelist files based on a npm package name.
    * `dist <string>` Relative path that starts with a npm package name. For instance: `"package/lib"`.
    * `recursive <boolean>`: indicates whether to whitelist files within nested directories. *Default*: `true`.
    * `external <boolean>` Indicates whether to whitelist dependencies outside of the repository. *Default*: `false`.

### Automated Recording Options

* `mode: "local" | "remote"` Defines whether the backend should be executed on the recorded process or on a remote process. *Default*: `"local"` for the API and `"remote"` for the CLI.
* `protocol "tcp" | "http1" | "http2"` Defines the communication protocol between frontend and backend. Only applicable in remote mode. `"tcp"` refers to a simple messaging protocol directly built on top of tcp and is the fastest option. *Default*: `"tcp"`.
* `port <number> | <string>` Defines the communication port between frontend and backend. Only applicable in remote mode. A string indicates a path to a unix domain socket which is faster. *Default*: `0` which will use a random available port.
* `recorder: "process" | "mocha"` Defines the main algorithm used for recording. *Default* `"process"`.
  * `"process"` Generate a single appmap which spans over the entire lifetime of the process.
  * `"mocha"` Generate an appmap for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).
* `scenario <string> | <string[]>` Whitelist scenarios for execution. *Default*: `[]` (no scenarios are executed by default).
  * `<string>` Shorthand, `"my-scenario"` is the same as `["my-scenario"]`.
  * `<string[]>` Name of the scenarios to execute sequentially.
* `scenarios <object>`
  An object whose values are either a single scenario or a list of scenarios. A scenario can be any of:
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
      * `... <SpawnScenario.options>` Any option from the `spawn` format is also supported
    * `configuration <Configuration>` Extension of the parent configuration. *Default*: `{}` -- ie: reuse the parent configuration.

### Common Options

* `log-level "debug" | "info" | "warning" | "error" | "off"` Usual log levels.
* `enabled <EnabledSpecifier> | <EnabledSpecifier[]>` Whitelist files to decide whether a node process should be instrumented based on the path of its main module. An `EnabledSpecifier` can be any of:
  * `<string>` Shorthand, `"test/**/*.mjs"` is the same as `{glob: "test/**/*.mjs"}`.
  * `<boolean>` Shorthand, `true` is the same as `{regexp:"^", enabled:true}` and `false` is the same as `{regexp:"^", enabled:false}`.
  * `<object>`
    * `enabled <boolean>` Indicates whether whitelisted files are enabled or not. *Default*: `true`.
    * `... <Specifier>` Extends from any specifier format. 
  *Default*: `[]` -- ie: the agent starts disabled and requires configuration extensions to record node processes.
* `language <string> | <object>`
  * `<string>` Shorthand, `"ecmascript@2020"` is the same as `{name: "ecmascript", version:"2020"}`.
  * `<object>`
    * `name "ecmascript"`
    * `version "es5" | "es6" | "es7" | "es"`
* `engine <string> | <object>`
  * `<string>` Shorthand, `name@version` is the same as `{name: "name", version:"version"}`.
  * `<object>`
    * `name <string>`
    * `version <string>`  
* `packages <PackageSpecifier> | <PackageSpecifier[]>` File whitelisting for instrumentation. A `PackageSpecifier` can be any of:
  * `<string>`: Shorthand, `"lib/**/*.js"` is the same as `{glob: "lib/**/*.js"}`.
  * `<object>`
    * `enabled <boolean>` Indicates whether the whitelisted file should be instrumented or not. *Default*: `true`.
    <!-- * `shallow <boolean>` -->
    * `exclude <string[]>` List of qualified name to exclude from instrumentation.
    * `... <Specifier>` Extends from any specifier format.
* `exclude <string[]>` A list of qualified name to always exclude from instrumentation.
* `source <boolean>` Indicates whether to include source code in the appmap file. *Default* `false`. 
* `hooks <object>` Flags controlling what the agent intercepts.
  * `cjs <boolean>` Indicates whether commonjs modules should be instrumented to record function applications. *Default*: `true`.
  * `esm <boolean>` Indicates whether native modules should be instrumented to record function applications. *Default*: `true` for the CLI and `false` for the API.
  * `group <boolean>` Indicates whether asynchronous resources should be monitored to infer causality link between events. This provides more accurate appmaps but comes at the price of performance overhead. *Default*: `true`.
  * `http <boolean>` Indicates whether [`http`](https://nodejs.org/api/http.html) should be monkey patched to monitor http traffic. *Default*: `true`.
  * `mysql <boolean>` Indicates whether [`mysql`](https://www.npmjs.com/package/mysql) should be monkey patched to monitor sql queries. The agent will crash if the `mysql` package is not available. *Default*: `false`.
  * `pg <boolean>` Indicates whether [`pg`](https://www.npmjs.com/pg) should be monkey patched to monitor sql queries. The agent will crash if the `pg` package is not available. *Default*: `false`.
  * `sqlite3 <boolean>` Indicates whether [`sqlite3`](https://www.npmjs.com/sqlite3) should be monkey patched to monitor sql queries. The agent will crash if the `sqlite3` package is not available. *Default*: `false`.
* `hidden-identifier <string>` The prefix of hidden variables used by the agent. The instrumentation will fail if variables from the program under recording starts with this prefix. *Default*: `"APPMAP"`.
* `function-name-placeholder <string>` The placeholder name for classmap function elements. *Default* `"()"`. 
* `validate <boolean> | <object>` Validation options which are useful to debug the agent.
* `<boolean>` Shorthand, `true` is the same as `{message: true, appmap:true}` and `false` is the same as `{message:true, appmap:true}`.
* `<object>`
  * `message <boolean>` Indicates whether to validate trace elements as they are buffered. This is useful to help diagnose the root cause of some bugs. *Default* `false`.
  * `appmap <boolean>` Indicates whether to validate the appmap before writting it to a file. *Default* `false`.
* `app null | <string>` Name of the recorded application. *Default*: `name` value found in `package.json` (`null` if `package.json` is missing).
* `name null | <string>` Name of the appmap. *Default*: `null`.
* `pruning <boolean>` Remove elements of the classmap which did not trigger any function application event. *Default*: `false`.
* `output <string> | <object>` Options to store appmap files.
  * `<string>` Shorthand, `"tmp/appmap"` is the same as `{directory: "tmp/appmap"}`.
  * `<object>`
    * `directory <string>` Directory to write appmap files.
    * `filename null | <string>` Filename to write the appmap file. Indexing will be appended to prevent accidental overwriting of appmap files within a single run. *Default*: `null` the agent will look at `name` then `app` then `main` to infer a relevant file name.
    * `indent 0 | 2 | 4 | 8` JSON indentation to use for writing appmap files. *Default*: `0` (no indentation).
    * `postfix <string>` String to include between the filename and the `.json` extension. *Default*: `".appmap"`.
* `serialization <string> | <object>` Serialization options.
  * `<string>` Shorthand, `"toString"` is the same as `{method: "toString"}`.
  * `<object>`
    * `method "toString" | "Object.prototype.toString"`: the name of the algorithm that should be used to print object runtime values (not `null` nor functions). `"toString"` will use the printing method provided by the object. Note that there is no guarantee that this method is side-effect free. By opposition `"Object.prototype.toString"` is always guaranteed to be side-effect free but provide a very vague description of the object. For instance: `/foo/g.toString()` is `"/foo/g"` whereas `Object.prototype.toString.call(/foo/g)` is `"[object RegExp]"`. *Default* `"toString"`.
    * `include-constructor-name <boolean>`: indicates whether or not to fetch the constructor name of runtime values. Fetching constructor name for every intercepted runtime value can add up to some performance overhead. Also, fetching constructor name can trigger code from the application being recorded if it uses [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). *Default* `true`.
    * `maximum-length <number>` the maximum length of the string representation of runtime values. *Default* `96`.


    
<!-- ## Application Representation

The appmap framework represent an application as a tree structure called *classmap*.
The base of classmap trees mirrors the file structure with `package` node.
Within a file, the following [estree](https://github.com/estree/estree) nodes are susceptible to be represented in the classmap.

* `ObjectExpression`, `ClassExpression`, and `ClassDeclaration` are represented by a `class` node.
* `ArrowFunctionExpression`, `FunctionExpresssion`, and `FunctionDeclaration` are represented by a `class` node which contains a `function` node as first element. This circumvoluted representation is required because the [appmap specfication](https://github.com/applandinc/appmap) does not allow `function` node to contain children.

### Qualified Name

`const object = ({method () {} })` `object.method`
`const class `



*Bounded* The node is the `value` property of `Property` or `MethodDefinition` node.
*Free*



### Class-like Nodes

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
