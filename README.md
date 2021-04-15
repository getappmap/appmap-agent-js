# appmap-agent-js


JavaScript client agent for the AppMap framework

To install:
```sh
npm install @appland/appmap-agent-js
```

To run:
```sh
npx appmap-agent -- main.mjs argv0 argv1
```

## CLI

* `--no-cjs`: Disable instrumentation of commonjs modules (enabled by default).
* `--no-esm`: Disable instrumentation of (native) es2015 modules (enabled by default).
* `--protocol <protocol>`: Specify the communication protocol between the process that is managing the code instrumentation and the appmap and the process that is executing the instrumented code.
  * `inline`: Simplest but does not prevent the program under test to mess with the recording. For instance:
    * Removing hooks to write the appmap before exiting the process -- eg: `process.removeAllListeners('exit')`.
    * Modifying the global object -- eg: `global.String.prototype.substring = null`.
  * `messaging`: Simple TCP messaging protocol (faster than `http1` and `http2`). 
  * `http1`
  * `http2`
* `--port <port>`: Specify the TCP port to perform the inter-process communication. Default is `0` which assign a random port. Path to unix domain sockets are also accepted. No effect if the protocol is `inline`.
* `--` Everything after the standalone double dash will be used to launch the program under test.
