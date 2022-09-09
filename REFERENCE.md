# appmap-agent-js reference

JavaScript agent for the AppMap framework.

To install and configure `appmap-agent-js`, see [Getting started](README.md).

Table of contents:
- [appmap-agent-js reference](#appmap-agent-js-reference)
  - [Automated Recording](#automated-recording)
    - [CLI](#cli)
    - [Process recording](#process-recording)
    - [Mocha Test Case Recording](#mocha-test-case-recording)
    - [Remote Recording](#remote-recording)
  - [Manual Recording](#manual-recording)
  - [Configuration](#configuration)
    - [Prelude: Specifier Format](#prelude-specifier-format)
    - [Automated Recording Configuration Fields](#automated-recording-configuration-fields)
    - [Common Options](#common-options)
  - [Application Representation](#application-representation)
    - [Classmap](#classmap)
    - [Qualified Name](#qualified-name)

## Automated Recording

The agent provides a CLI to spawn and record node processes.
By default, the agent will look for a configuration file at `./appmap.yml`.
The configuration format is detailed [here](#configuration).

### CLI

* *Named arguments* Any configuration field.
  This takes precedence over the options from the configuration file.
  For instance:
  ```sh
  npx appmap-agent-js --name my-appmap-name --app my-app-name
  ```
  Aliases:
  | Alias               | Corresponding Name     |
  |---------------------|------------------------|
  | `--log-level`       | `log.level`            |
  | `--log-file`        | `log.file`             |
  | `--app-port`        | `intercept-track-port` |
  | `--alt-remote-port` | `track-port`           |
  | `--appmap-dir`      | `appmap_dir`           |
  In addition, the command can be encoded as positional argument.
  For instance, these commands have the same effect:
  ```sh
  npx appmap-agent-js -- node main.js
  npx appmap-agent-js --command 'node main.js'
  ```
* *Environment variables*
    * `APPMAP_CONFIGURATION_PATH`: path to the configuration file, default: `./appmap.yml`.
    * `APPMAP_REPOSITORY_DIRECTORY`: directory to the project's home directory, default: `.`.
    Requirements:
      * *[mandatory]* Access to the `@appland/appmap-agent-js` npm module.
      * *[preferred]* Be a git repository.
      * *[preferred]* Contain a valid `package.json` file.

### Process recording

The first option to automatically generate appmaps is called process recording.
It involves recording node processes from start to finish and write the resulting trace to local files.

```yaml
recorder: process
command: "node bin/bin.js argv1 argv2" # the usual command for running the project
appmap_dir: tmp/appmap
```

### Mocha Test Case Recording

The second option to automatically generate appmaps is called mocha test case recording.
It involves recording mocha test cases (ie `it` calls) in separate traces and write each one of them in separate files.
Note that mocha run the entire test suite within a single node process.
Hence all the exercised parts of the application will probably end up being included into every generated appmap.
The `pruning` configuration option can be used to solve this issue.
If enabled, the appmap will be stripped of the elements of the classmap that did not cause any function applications.

```yaml
recorder: mocha
command: "mocha --recursive 'test/**/*.js'" # the usual command for running mocha tests
pruning: true
```

Note that the agent will expect the `mocha` executable as first token of the command.
It is also possible to run mocha via `npx`.
However this will cause the recording of the `npx` process as well.
To avoid recording this process, it should be blacklisted.

```yaml
recorder: mocha
command: "npx mocha --recursive 'test/**/*.js'" # the usual command for running mocha tests
pruning: true
processes:
  regexp: "/npx$" # do not record node processes whose entry script ends with npx
  enabled: false
```

### Remote Recording

The third option to automatically generate appmaps is on-demand via HTTP requests.
The remote recording web API is documented [here](https://appland.com/docs/reference/remote-recording).

```yaml
recorder: remote
track-port: 8080
intercept-track-port: 8000
```

Remote recording requests can be delivered to two possible end points:

|                         | Configuration Field    | Routing              | Comment                                                                                |
|-------------------------|------------------------|----------------------|----------------------------------------------------------------------------------------|
| Dedicated Backend Port  | `track-port`           | `/{session}/{track}` | If `session` is `"_appmap"` then the (assumed) single active session will be selected. |
| Intercept Frontend Port | `intercept-track-port` | `/_appmap/{track}`   | Will not be active until the application deploy an HTTP server on that port.           |

## Manual Recording

The agent also provides an API to manually record events in the node process in which it is imported.

```js
import {createAppMap} from "@appland/appmap-agent-js";
// NB: Only a single concurrent appmap is allowed per process
const appmap = createAppMap(
  repository_directory,    // default: process.cwd()
  configuration,           // default: {}
  configuration_directory, // default: null
);
// NB: An appmap can create multiple (concurrent) tracks
const track = "my-identifier";
appmap.startRecording(track, {
  app: "my-app-name",
  name: "my-appmap-name",
  pruning: true,
  recording: {
    "defined-class": "defined-class",
    "method-id": "method-id",
  },
});
appmap.recordScript(
  "(function main () { return 123; } ());",
  "path/to/main.js",
);
const trace = appmap.stopRecording(track, {
  status: 0,
  errors: []
});
console.log(JSON.stringify(trace, null, 2));
```

### `createAppMap(home, configuration, base)`

* `home <string>` The file url of the project. Default: file url of the current working directory.
* `configuration <object>` Root configuration. Default: `{}`.
* `base <string>` The file url of the directory to resolve the relative paths of the configuration argument.
* Returns `<appmap>` an appmap instance and start recording.

### `appmap.terminate()`

Stop recording. Subsequent method invocations will throw exception.

### `appmap.startRecording(track, configuration, base)`

* `track <string> | null` An identifier for the track. Default: `null`, a random string will be used
* `configuration <object>` Configuration for extending the configuration of the appmap instance. Default: `{}`.
* `base <string> | null`: The file url of the directory to resolve the relative paths of the configuration argument. Default: `null`, the presence of relative paths will throw an error.
* Returns `<string>` the identifier for the track. This is useful when providing `null` for the `track` argument.

### `appmap.stopRecording(track, status, errors)`

* `track <string>`
* `status <number>` Exit status code. Default: `[]`.
* `errors <Errors[]>` List of errors that happened during the track lifetime. Default: `[]`.
* Returns `<object>` the recorded trace in the appmap format -- ie: a JSON object.

### `appmap.recordScript(content, url)`

* `content <string>` Script content.
* `url <string>` Script location.
* Returns `<any>` the completion value of the script.

### `appmap.instrumentScript(content, url)`

* `content <string>` Script content.
* `url <string>` Script location.
* Returns `<string>` the instrumented code to run as a module.

### `appmap.instrumentModule(content, url)`

* `content <string>` Script content.
* `url <string>` Script location.
* Returns `<string>` the instrumented code to run as a script.

<!-- ### `appmap.recordBeginBundle()`

* Returns `recordEndBundle()`
  * Returns `undefined`.

This methods record an anonymous bundle. This event does not appear in the generated appmap but is useful to bundle events together. `appmap.recordApply` and `appmap.recordServerRequest` are also bundle operations.

### `appmap.recordApply(input)`

* `input <object>` The input of the application. We are still figuring out a way to manually define the called function.
  * `this <any>` The `this` argument. Default: `undefined`.
  * `arguments <any[]>` The list of arguments. Default: `[]`.
* Returns `recordReturn(output)`
  * `output <object>` The output of the application. One and only one the two properties must be defined.
    * `error: <any>` The thrown value of application (if present).
    * `result: <any>` The returned value of the application (if present).
    * Returns `undefined`.

### `appmap.recordServerRequest(request)`

* `request <object>` The head of the incoming HTTP request
  * `protocol <string>` The HTTP protocol. Default: `"HTTP/1.1"`.
  * `method <string>` The HTTP method. Default: `"GET"`.
  * `url <string>` The requested URL. Default: `"/"`.
  * `headers <object>` The HTTP headers. Default: `{}`.
  * `route <string> | null` The normalized requested URL (ie stripped of dynamic data). Default: `"null"`.
* Returns `recordServerResponse(response)`
  * `response <object>` The head of the outgoing HTTP response.
    * `status <number>` The HTTP status code. Default: `200`.
    * `message <string>` The HTTP status message. Default: `"OK"`.
    * `headers <object>` The HTTP headers. Default: `{}`.
  * Returns `undefined`.

### `appmap.recordBeforeJump()`

* Returns `recordAfterJump()`
  * Returns `undefined`.

This methods record an anonymous jump. This event does not appear in the generated appmap but is useful link events togethers. `appmap.recordQuery` and `appmap.recordClientRequest` are also jump operations.

### `appmap.recordQuery(query)`

* `query <object>`
  * `database <string>` Name of the database service. Default: `"unknown"`.
  * `version <string>` Version of the database service. Default: `"unknown"`.
  * `sql <string>` SQL query string. Default: `"unknown"`.
  * `parameters <any[]> | <object>` Parameters to replace in placeholders. If placeholders are anonymous, then `parameters` should be an array. If placeholders are named, then `parameters` should be a mapping object. Default: `[]`.
* Returns `recordResult(result)`
  * `result <object>`
    * `error <Error>` Potential error while processing the query.
  * Returns `undefined`.

### `appmap.recordClientRequest(request)`

Same type signature as `appmap.recordServerResponse` but without `route` property. Note that this method records a jump whereas `appmap.recordServerResponse` records a bundle. -->

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
    * `recursive <boolean>` Indicates whether to whitelist files within nested directories. *Default*: `true`.
    * `external <boolean>` Indicates whether to whitelist dependencies outside of the repository. *Default*: `false`.

### Prelude: Exclusion Format

The agent filter code objects (functions or objects/classes) based on a format called `Exclusion`. Which can be either a string or an object:
* `<string>` Shorthand, `"foo\\.bar"` is the same as `{"qualified-name":"foo\\.bar"}`
* `<object>`
    * `combinator "and" | "or"` Indicates whether the four criteria -- ie: `name`, `qualified-name`, `some-label`, and `every-label` -- should all be satisfied or if at least one should be satisfied. These criterion has two form: the pattern form which is a string or the static boolean form. If `combinator` is `"and"` then the default value for these criterion is `true`. If the combinator is `"or"` then the default value for these criterion is `false`.
      *Default*: "and".
    * `name <string> | <boolean>` A pattern to match against the name of the code object. The agent will assign static names to code object with an algorithm that resemble the [ECMAScript function naming algorithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name).
    * `qualified-name <string> | <boolean>` A pattern to match against the qualified name of the code object. For classes/objects, the qualified name is the same as the name. For functions which are methods, the name of their enclosing object/class are prepended. For instance: `foo#bar` for a static method named `bar` defined on an object named `foo`.
    * `some-label <string> | <boolean>` A pattern that should match at least one label of the function. This criterion is not applicable to classes/objects. The only way for a function without labels to satisfy this criterion is to use the boolean form.
    * `every-label <string> | <boolean>` A pattern that should match all labels of the function. This criterion is not applicable to classes/objects. The only way for a function without labels to not satisfy this criterion is to use the boolean form.
    * `excluded <boolean>` Indicates whether the matching code object should be excluded or not.
      *Default*: `true`.
    * `recursive <boolean>` If `excluded` is `true`, this indicates whether the children of the matched code object should be excluded as well.
      *Default*: `true`.

### Automated Recording Configuration Fields

* `command <string> | <string[]>` The command to record. It is either a string or a list of tokens that will be escaped with single quotes. It follows that only simple commands can currently be executed -- eg: piping and chaining is not possible. This limitation might be lifted in the future.
* `command-options <object>` Options to run the command, inspired by node's `child_process` library.
    * `shell null | string[]` An optional prefix for executing the command. If `null`, it will be `["/bin/sh", "-c"]` on unix-like platforms and `["cmd.exe", "/c"]` on windows (with support for the `ComSpec` environment variable).
    * `env <object>` Environment variables. Note that Unlike for the [child_process#spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options), the environment variables from the parent process will always be included.
    *Default*: `{}` -- ie: the environment variables from the parent process.
    * `stdio <string> | <string[]>` Stdio configuration, only `"ignore"` and `"inherit"` are supported.
    * `encoding "utf8" | "utf16le" | "latin1"` Encoding of all the child's stdio streams.
    * `timeout <number>` The maximum number of millisecond the child process is allowed to run before being killed. *Default*: `0` (no timeout).
    * `killSignal <string>` The signal used to kill the child process when it runs out of time. *Default*: `"SIGTERM"`.
* `recorder "process" | "remote" | "mocha"` Defines the main algorithm used for recording. *Default* `null`.
    * `null` Will pick between `"remote"` and `"mocha"` based on the content of the command.
    * `"process"` Generate a single appmap which spans over the entire lifetime of the process.
    * `"mocha"` Generate an appmap for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).
    * `"remote"` Generate appmap on demand via HTTP requests.
* `socket "unix" | "net"` Defines the socket implementation to use: [`posix-socket`](https://www.npmjs.com/package/posix-socket) or [`net.Socket`](https://nodejs.org/api/net.html#class-netsocket). The `posix-socket` module provide synchronous methods which avoid creating asynchronous resources that are observed when `ordering` is `"causal"`. To avoid infinite loop, the `"net"` implementation buffers messages. The `"unix"` is probably the better option but it requires node-gyp compilation and is not available on windows. If `"unix"` is chosen but the `posix-socket` could not be installed, the agent will fallback on `"net"`. Default: `"unix"`.
* `heartbeat <number> | null` Defines the interval in millisecond where the socket should be flushed. This only has effect if `socket` is `"net"`. Default: `1000`.
* `threshold <number> | null` Defines the maximum number of message before the socket should be flushed. This only has effect if `socket` is `"net"`. Default: `100`.
* `trace-port <number> | <string>` Defines the communication port between frontend and backend. A string indicates a path to a unix domain socket which is faster. *Default*: `0` which will use a random available port.
* `track-port <number> | <string>`: Port in the backend process for serving remote recording HTTP requests. *Default*: `0` A random port will be used.
* `intercept-track-port <string>`: Regular expression to whitelist the ports in the frontend process for intercepting remote recording HTTP requests. *Default*: `"^"` Every detected HTTP ports will be spied upon.
* `processes <boolean> | <string> | <EnabledSpecifier> | <EnabledSpecifier[]>` Whitelist files to decide whether a node process should be instrumented based on the path of its main module. An `EnabledSpecifier` can be any of
    * `<boolean>` Shorthand, `true` is the same as `{regexp:"^", enabled:true}` and `false` is the same as `{regexp:"^", enabled:false}`.
    * `<string>` Shorthand, `"test/**/*.mjs"` is the same as `{glob:"test/**/*.mjs", enabled:true}`.
    * `<object>`
        * `enabled <boolean>` Indicates whether whitelisted files are enabled or not. *Default*: `true`.
        * `... <Specifier>` Extends from any specifier format.
  *Default*: `[]` -- ie: the agent will be enabled for every process whose entry script resides in the repository directory.
* `scenarios <Configuration[]>` An array of child configuration.
* `scenario <string>` A regular expression to whitelist scenarios for execution. If the root configuration contains a command, it will always be executed. *Default*: `"^"` (every scenario will be executed).
* `appmap_dir <string>` Path to directory for storing appmap files. *Default*: `"tmp/appmap"`.
* `appmap_file <string> | null` Base name (ie file name but without the extension) of the file where the appmap data should be written. *Default*: `null` the agent will look at the `name` configuration field, if it is `null` as well, `"anonymous"` will be used.

### Common Options

* `log "debug" | "info" | "warning" | "error" | "off"` Usual log levels. *Default*: `"info"`.
* `packages <PackageSpecifier> | <PackageSpecifier[]>` File filtering for instrumentation. A `PackageSpecifier` can be any of:
    * `<string>`: Glob shorthand, `"lib/**/*.js"` is the same as `{glob: "lib/**/*.js"}`.
    * `<object>`
        * `enabled <boolean>` Indicates whether the filtered file should be instrumented or not. *Default*: `true`.
        * `shallow <boolean>` Indicates whether the filtered file should
        * `exclude <Exclusion[]>` Additional code object filtering for the matched file.
        * `... <Specifier>` Extends from any specifier format.
* `exclude <Exclusion[]>` Code object filtering to apply to every file.
* `source <boolean>` Indicates whether to include source code in the appmap file. *Default* `false`.
* `hooks <object>` Flags controlling what the agent intercepts.
    * `cjs <boolean>` Indicates whether commonjs modules should be instrumented to record function applications. *Default*: `true`.
    * `esm <boolean>` Indicates whether native modules should be instrumented to record function applications. *Default*: `true` for the CLI and `false` for the API.
    * `eval <boolean> | <String[]>` Defines the call expressions that should be considered as eval calls. More precisely, if a call expression has an identitifier as callee whose name appears in `hooks.eval` then its first argument will be instrumented as an `eval` code. `true` is a shorthand for `["eval"]` and `false` is a shorthand for `[]`. *Default*: `false`.
    * `group <boolean>` Indicates whether asynchronous resources should be monitored to infer causality link between events. This provides more accurate appmaps but comes at the price of performance overhead. *Default*: `true`.
    * `http <boolean>` Indicates whether [`http`](https://nodejs.org/api/http.html) should be monkey patched to monitor http traffic. *Default*: `true`.
    * `mysql <boolean>` Indicates whether [`mysql`](https://www.npmjs.com/package/mysql) should be monkey patched to monitor sql queries. The agent will crash if the `mysql` package is not available. *Default*: `true`.
    * `pg <boolean>` Indicates whether [`pg`](https://www.npmjs.com/pg) should be monkey patched to monitor sql queries. The agent will crash if the `pg` package is not available. *Default*: `true`.
    * `sqlite3 <boolean>` Indicates whether [`sqlite3`](https://www.npmjs.com/sqlite3) should be monkey patched to monitor sql queries. The agent will crash if the `sqlite3` package is not available. *Default*: `true`.
* `ordering "chronological" | "causal"` *Default*: `"causal"`.
* `app <string>` Name of the recorded application. *Default*: `null` the value found in `package.json` if any.
* `name <string>` Name of the appmap. *Default*: `null` the agent will do its best to come up with a meaningful name.
* `pruning <boolean>` Remove elements of the classmap which did not trigger any function application event. *Default*: `true`.
* `serialization <object>` Serialization options. Many options focus on defining how aggressive the serialization should be. Pure serialization is faster and avoids disturbing the flow of the observed application but is less detailed than impure serialization.
    * `maximum-print-length <number> | null` the maximum length of the string representation of values before being truncated. `null` indicates no limitation. *Default* `100`.
    * `maximum-properties-length <number> | null` the maximum of amount of properties serialized for hash objects. Objects are considered as hashes if their prototype is either `null` or `Object.prototype`. `null` indicates no limitation. *Default* `10`.
    * `impure-printing <boolean>` indicates whether to use a pure printing algorithm or not. For instance, an object can be printed either using `Object.prototype.toString.call(object)` which is pure or `object.toString()` which is impure. *Default* `true`.
    * `impure-constructor-naming <boolean>` indicates whether the constructor name should be retrieved using `Object.prototype.toString.call(object)` which is pure or using `object.constructor.name` which is impure. *Default* `true`.
    * `impure-array-inspection <boolean>` indicates whether the length of an array should be retrieved which is an impure operation. *Default* `true`.
    * `impure-error-inspection <boolean>` indicates whether the message and stack of an error should be retrieved which is an impure operation. *Default* `true`.
    * `impure-hash-inspection <boolean>` indicates whether the properties of an hash object should be inspected which is an impure operation. *Default* `true`.
* `hidden-identifier <string>` The prefix of hidden variables used by the agent. The instrumentation will fail if variables from the program under recording starts with this prefix. *Default*: `"APPMAP"`.
* `function-name-placeholder <string>` The placeholder name for classmap function elements. *Default* `"()"`.
* `collapse-package-hiearchy <boolean>` Indicates whether packages should organized as a tree which mirrors the structure of the file system or if they should be flatten into a list. *Default*: `true`.
* `validate <boolean> | <object>` Validation options which are useful to debug the agent.
    * `<boolean>` Shorthand, `true` is the same as `{message: true, appmap:true}` and `false` is the same as `{message:true, appmap:true}`.
    * `<object>`
        * `message <boolean>` Indicates whether to validate trace elements as they are buffered. This is useful to help diagnose the root cause of some bugs. *Default* `false`.
        * `appmap <boolean>` Indicates whether to validate the appmap before writing it to a file. *Default* `false`.

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
