# appmap-agent-js

JavaScript client agent for the AppMap framework.

To install:
```sh
npm install @appland/appmap-agent-js
```

To run:
```sh
mkdir tmp
mkdir tmp/appmap
npx appmap-agent-js -- main.mjs argv0 argv1
cat tmp/appmap/main.appmap.json
```

## Requirements

* unix-like os
* git
* node >= v14.x
* curl >= 7.55.0

<!-- * `--experimental-loader` requires `>= nodev9.0.0` 
* `NODE_OPTIONS` requires `>= nodev8.0.0`
* `--require` requires `>= nodev1.6.0` -->

## Configuration

### Agent-related Options

* `protocol <string>` Protocol by which. *Default*: `"messaging"`.
  * `"messaging"`: Simple TCP messaging protocol (faster than `http1` and `http2`). 
  * `"http1"` and `"http2"`: Standard `http` communication. Will be useful in the future to support browser recording and recording of node processes located on a remote host.
  * `"inline"`: This protocol indicates the agent to inline its logic into the client process. This removes some communication overhead but comes at the cost of worsening the separation between the agent logic and the program under recording logic. For instance, the program under test may mess with the recording in the following ways:
    * Removing hooks to write the appmap before exiting the process -- eg: `process.removeAllListeners('exit')`.
    * Modifying the global object -- eg: `global.String.prototype.substring = null`.
* `port <number> | <string>`: Communication port; a string indicates a path to unix domain socket which is faster. *Default*: `0` which will use a random available port.
* `concurrency <number> | <string>`: Set the maximum number of concurrent children. If it is a string, it should be formatted as `/[0-9]+%/` and it is interpreted as a percentage of the host's number of logical core. For instance `"50%"` will results in maximum 2 concurrent children on a machine of 4 logical cores. *Default*: `1` (sequential children spawning).
* `children <Child[]>`: A list of childeren to spawn.
  * `<string>`: same as `/bin/sh`
  * `<string[]>`: same as `{spawn, exec:}`
  * ``

### Appmap-related Options

A 

* `hook-cjs <boolean>`: Indicates whether commonjs modules should be instrumented to record call events. *Default*: true.
* `hook-esm <boolean>`: Indicates whether native modules should be instrumented to record call events. *Default*: true. 
* `hook-http <boolean>`: Indicates whether the native modules `http` and `https` should be monkey-patched to record `http` traffic. *Default*: true.
* `enabled <boolean> | <Specifier[]>`:
* `escape-prefix`: The prefix of the variables used to store recording-related data. If variables from the program under recording starts with this prefix, the instrumentation will fail. *Default*: `"APPMAP"`.
* `packages`
* `exclude <string[]>`: A list of name to always exclude from function

### Recording-related Options

A single appmap may have multiple recordings enable at the same time.

* recording
* `class-map-pruning <boolean>`: Indicates whether all the code entities (ie elements of the `classMap` array) of a file should be pruned off the file did not produce any call/return event. *Default*: `false`.
* `event-pruning <boolean>`: Indicates whether call/return events should be pruned off if they are not located .
* `output <string> | <object>`: Path of the directory where appmap files should be written. The name of the file is based on the `map-name` option if it is present. Else, it is based on the path of the main module. It is also possible to explicitly set the name of the file using the object form: `{"directory": "path/to/output", "file-name": "my-file-name"}`. Note that `.appmap.json` will appened to the provided 

If it is an object is may contain two string properties: `directory` and `file-name`. 
* `base <string> | <object>`: Path of the directory to which paths from the recording should be express relatively. If it is an object it should be of the form `{"directory": "path/to/base"}`. `"path/to/base"` is the same as `{directory:"path/to/base/"}`. *Default*: current working directory of the agent process.
* `app-name <string>`: Name of the app that is being recorded.
* `map-name <string>`: Name of the recording.
* `name <string>`: Synonym to `map-name`.

## CLI

```text
npx appmap-agent <method> <options> -- <command>
```

### Command

The command you would normally run (including the `node` command if applicable).
For instance:

* `node script.js argv0 argv1`
* `node module.mjs argv0 argv1`
* `globally-installed-module argv0 argv1`
* `npx locally-installed-module argv0 argv1`

### Basic optional arguments:

* `--node-version = 14.x | 15.x | 16.x`, default `14.x`: Indicate with which node version the recording should be compatible with. If the command is executing an older node version, a runtime error will be thrown. We are working toward supporting older node versions.
* `--no-hook-cjs`: Disable instrumentation of commonjs modules (enabled by default).
* `--no-hook-esm`: Disable instrumentation of (native) es2015 modules (enabled by default).
<!-- * `--hook-child-process`: Enable instrumentation of spawn child processes (disabled by default). -->
* `--rc-file = ...`, default `./appmap.yml`: Path to configuration file.

### Advanced optional arguments:

* `--protocol = inline | messaging | http1 | http2`, default `messaging`: Specify the communication protocol between the process that is managing the code instrumentation and the process that is executing the instrumented code.
  * `inline`: Simplest but does not prevent the program under test to mess with the recording. For instance:
    * Removing hooks to write the appmap before exiting the process -- eg: `process.removeAllListeners('exit')`.
    * Modifying the global object -- eg: `global.String.prototype.substring = null`.
  * `messaging`: Simple TCP messaging protocol (faster than `http1` and `http2`). 
  * `http1`
  * `http2`
* `--port = ...`, default `0`: Specify the TCP port to perform the inter-process communication (`0` will assign a random port). Path to unix domain sockets are also accepted. This option has no effect if the protocol is set to `"inline"`.
