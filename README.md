# appmap-agent-js

JavaScript client agent for the AppMap framework.

To install:
```sh
npm install @appland/appmap-agent-js
```

To run:
```sh
npx appmap-agent -- main.mjs argv0 argv1
```

## Requirements

- unix-like os
- node v14.x
- git
- curl >= 7.55.0

## CLI

```text
npx appmap-agent <method> <options> -- <command>
```

### Method

At the moment there is only one method. In the future, new functionalities will be added here.

* `spawn`: Spawn a node process (the default method).

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
* `--hook-child-process`: Enable instrumentation of spawn child processes (disabled by default).
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
