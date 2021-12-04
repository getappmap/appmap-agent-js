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
  | Alias          | Corresponding Name |
  |----------------|--------------------|
  | `--log-level`  | `--log`            |
  | `--output-dir` | `--output`         |
  In addition, the command can be encoded as positional argument.
  For instance, these commands have the same effect:
  ```sh
  npx appmap-agent-js -- node main.js
  npx appmap-agent-js --command: 'node main.js'
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
output:
  directory: tmp/appmap
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
    "defined-class": "defined-class",
    "method-id": "method-id",
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

* `command <string>` The command to record.
* `command-options <object>` Options to run the command, inspired by node's `child_process` library.
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
* `output <string> | <object>` Options to store appmap files.
    * `<string>` Shorthand, `"tmp/appmap"` is the same as `{directory: "tmp/appmap"}`.
    * `<object>`
        * `directory <string>` Directory to write appmap files. *Default*: `null` the agent will choose between `"tmp/appmap/mocha"` and `"tmp/appmap"` based on the `recorder` field.
        * `basename null | <string>` Basename of the future appmap file. Indexing will be appended to prevent accidental overwriting of appmap files within a single run. *Default*: `null` the agent will look at the `name` configuration field, if it is `null` as well, `"anonymous"` will be used.
        * `extension <string>` Extension to append after the basename. *Default*: `".appmap.json"`.

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
    * `group <boolean>` Indicates whether asynchronous resources should be monitored to infer causality link between events. This provides more accurate appmaps but comes at the price of performance overhead. *Default*: `true`.
    * `http <boolean>` Indicates whether [`http`](https://nodejs.org/api/http.html) should be monkey patched to monitor http traffic. *Default*: `true`.
    * `mysql <boolean>` Indicates whether [`mysql`](https://www.npmjs.com/package/mysql) should be monkey patched to monitor sql queries. The agent will crash if the `mysql` package is not available. *Default*: `true`.
    * `pg <boolean>` Indicates whether [`pg`](https://www.npmjs.com/pg) should be monkey patched to monitor sql queries. The agent will crash if the `pg` package is not available. *Default*: `true`.
    * `sqlite3 <boolean>` Indicates whether [`sqlite3`](https://www.npmjs.com/sqlite3) should be monkey patched to monitor sql queries. The agent will crash if the `sqlite3` package is not available. *Default*: `true`.
* `ordering "chronological" | "causal"` *Default*: `"causal"`.
* `app <string>` Name of the recorded application. *Default*: `null` the value found in `package.json` if any.
* `name <string>` Name of the appmap. *Default*: `null` the agent will do its best to come up with a meaningful name.
* `pruning <boolean>` Remove elements of the classmap which did not trigger any function application event. *Default*: `true`.
* `serialization <string> | <object>` Serialization options.
    * `<string>` Shorthand, `"toString"` is the same as `{method: "toString"}`.
    * `<object>`
        * `method "toString" | "Object.prototype.toString"`: the name of the algorithm that should be used to print object runtime values (not `null` nor functions). `"toString"` will use the printing method provided by the object. Note that there is no guarantee that this method is side-effect free. By opposition `"Object.prototype.toString"` is always guaranteed to be side-effect free but provide a very vague description of the object. For instance: `/foo/g.toString()` is `"/foo/g"` whereas `Object.prototype.toString.call(/foo/g)` is `"[object RegExp]"`. *Default* `"toString"`.
        * `include-constructor-name <boolean>`: indicates whether or not to fetch the constructor name of runtime values. Fetching constructor name for every intercepted runtime value can add up to some performance overhead. Also, fetching constructor name can trigger code from the application being recorded if it uses [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy). *Default* `true`.
        * `maximum-length <number>` the maximum length of the string representation of runtime values. *Default* `96`.
* `hidden-identifier <string>` The prefix of hidden variables used by the agent. The instrumentation will fail if variables from the program under recording starts with this prefix. *Default*: `"APPMAP"`.
* `function-name-placeholder <string>` The placeholder name for classmap function elements. *Default* `"()"`.
* `collapse-package-hiearchy <boolean>` Indicates whether packages should organized as a tree which mirrors the structure of the file system or if they should be flatten into a list. *Default*: `true`.
* `validate <boolean> | <object>` Validation options which are useful to debug the agent.
    * `<boolean>` Shorthand, `true` is the same as `{message: true, appmap:true}` and `false` is the same as `{message:true, appmap:true}`.
    * `<object>`
        * `message <boolean>` Indicates whether to validate trace elements as they are buffered. This is useful to help diagnose the root cause of some bugs. *Default* `false`.
        * `appmap <boolean>` Indicates whether to validate the appmap before writting it to a file. *Default* `false`.

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
