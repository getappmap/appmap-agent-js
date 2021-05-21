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
echo 'enabled: true' > appmap.yml
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

## CLI (Automated Recording)

The agent's CLI is essentially a test runner augmented with recording capability.
More precisely, the agent spawns/forks child processes based on configuration data and coordinates their recording.
To reduce the risk of the recording interfering with the program under recording we move as much logic as possible on the parent process.
For instance, instrumentation is performed on the parent process.

By default, the agent will read configuration data on the file `./appmap.yml`.
A custom location for the configuration file can be provided with the `--rc-file` CLI argument.
At the moment, the presence of a configuration file is mandatory.

Below we present the three logics currently supported by the agent to perform recording.

### Normal Recorder

The normal recorder will create a single appmap file for the entire child process.
This is the default recorder that will be used by the agent.
For instance, by specifying a forked child:

```yaml
# appmap.yml
enabled: true
childeren:
  - type: fork
    recorder: normal # superfluous
    main: main.js
    argv: [argv0, argv1]
```

Globbing is also supported:

```yaml
# appmap.yml
enabled: true
childeren:
  - type: fork
    recorder: normal # superfluous
    globbing: true # false by default
    main: *.js
    argv: [argv0, argv1]
```

Child processes can also be spawned which provides more flexibility but does not support globbing:

```yaml
# appmap.yml
enabled: true
childeren:
  - type: spawn
    recorder: normal # superfluous
    exec: node
    argv: [main1.js, argv0, argv1]
  # A simpler array format is also supported:
  - [node, main2.js, argv0, argv1]
  # Even direct string:
  - 'node main3.js argv0 argb1'
  # NB: Strings are normalized into:
  - type: spawn
    exec: /bin/sh
    argv: [-c, 'node main3.js argv0 argv1']
```

Spawning children can also be done via CLI arguments:

```sh
npx appmap-agent-js
  --enabled true
  # multiple children can be provided with the string format
  --childeren 'node main1.js argv0 argv1'
  --childeren 'node main2.js argv0 argv2'
  # the array format can be provided as positional arguments:
  -- node main3.js argv0 argv2
```

An important difference between forked and spawned children is that: forked children will not propagate the recording to their own child processes while spawned children will. This is because, under the hood, forked children use command line arguments while spawned children use environment variables.

The `enabled` option can be tuned to prevent recording unwanted processes.
For instance:

```yaml
# appmap.yml
enabled:
  # Only record node processes whose main module is
  # located (deep) inside the cwd. Hence the npx
  # command will not be recorded.
  - path: .
    recursive: true
childeren:
  - type: spawn
    recorder: normal # superfluous
    exec: npx
    argv: [package-name, argv0, argv1]
```

### Mocha Recorder

The mocha recorder will create an appmap file for each test case (ie `it` calls) of the entire test suite (ie every `describe` calls on every test file).

```js
// lib/abs.mjs
exports const abs = (x) => x < 0 ? -x : x;
```

```js
// test/abs.mjs
import {abs} from "../lib/abs.mjs";
import {strict as Assert} from "assert";
describe("abs", function () {
  // will generate tmp/appmap/abs-0.appmap.json
  it("should return a positive number when provided a positive number", function () {
    Assert.ok(abs(-3) > 0);
  });
  // will generate tmp/appmap/abs-1.appmap.json
  it("should return a positive number when provided a negative number", function () {
    Assert.ok(abs(3) > 0);
  });
});
```

```yaml
# appmap.yml #
enabled:
  # Avoid recording the npx command
  - path: test/
    recursive: true
packages:
  # Instrument all files (recursively) located in lib
  - path: lib/
    recursive: true
childeren:
  # Use the globally installed mocha package
  - type: spawn
    recorder: mocha
    exec: mocha
    argv: [test/abs.mjs]
  # Alternatively, use a command to execute the mocha package
  - type: spawn
    recorder: mocha
    exec: [npx mocha]
    argv: [test/abs.mjs]
  # This will *not* work:
  - type: spawn
    recorder: mocha
    exec: npx
    argv: [mocha, test/abs.mjs]
# NB: Forked children can not be recorded via the mocha recorder
```

```sh
npx appmap-agent-js
cat tmp/appmap/abs-0.appmap.json
cat tmp/appmap/abs-1.appmap.json
```

### Empty Recorder

By itself, the empty recorder will not generate any appmap file.
It is useful for increasing the capabilities of manual recording or simply for using the agent as a regular test runner.
More information [here](api-manual-recording).

```yaml
# appmap.yml
enabled: true
childeren:
  - type: spawn
    recorder: null
    exec: node
    argv: [main.js]
  - type: fork
    recorder: null
    main: main.js
```

### API (Manual Recording)

An API is provided to perform manual recording.

```js
import {makeAppmap} from "appmap-agent-js";
// Prepare the process for recording
// NB: Only a single concurrent appmap is allowed per process
const appmap = makeAppmap(appmap_configuration);
// Start recording events
// NB: An appmap can create multiple (concurrent) recordings
const recording = appmap.start(recording_configuration);
// Stop recording events
recording.pause();
// Restart recording events
recording.play();
// Terminate the recording and write the appmap file
recording.stop();
```

An asynchronous api is also provided:
```js
import {makeAppmapAsync} from "appmap-agent-js";
((async () => {
  const appmap = await makeAppmapAsync(appmap_configuration);
  const recording = await appmap.startAsync(recording_configuration);
  await recording.pauseAsync();
  await recording.playAsync();
  await recording.stopAsync();
}) ());
```

Note that the synchronous and asynchronous API's can be intertwined freely .
In clear, a synchronously created appmap can perform asynchronous methods and vice-versa.

Under the hood, the API chooses between modes.
In the remote mode, the API detected that it has been required within a process that has been spawned/forked by the agent's CLI (with the empty recorder) and start communicating with the agent process.
In the inline mode, the API will embeds the logic the is normally located on the agent process.
This eliminates some communication overhead but comes at the price of blurring the separation between the recorder and the recordee.

## Configuration

**Work in progress**

Source: [json-schema](src/schema.yml)

### Agent-related Options

These options define the behaviour of the agent as a test runner.

* `protocol <string>` Protocol by which the agent process and its children processes should communicate. *Default*: `"messaging"`.
  * `"messaging"`: Simple TCP messaging protocol (faster than `http1` and `http2`). 
  * `"http1"` and `"http2"`: Standard `http` communication. Will be useful in the future to support browser recording and recording of node processes located on a remote host.
  * `"inline"`: This protocol indicates the agent to inline its logic into the client process. This removes some communication overhead but comes at the cost of blurring the separation between the agent logic and the program under recording logic. For instance, the program under test may mess with the recording in the following ways:
    * Removing hooks to write the appmap before exiting the process -- eg: `process.removeAllListeners('exit')`.
    * Modifying the global object -- eg: `global.String.prototype.substring = null`.
* `port <number> | <string>`: Port through which the agent process and its childeren processes should communicate. A string indicates a path to a unix domain socket which is faster. *Default*: `0` which will use a random available port.
* `concurrency <number> | <string>`: Set the maximum number of concurrent children. If it is a string, it should be formatted as `/[0-9]+%/` and it is interpreted as a percentage of the host's number of logical core. For instance `"50%"` in machine with 4 logical core will results in maximum 2 concurrent children. *Default*: `1` (sequential children spawning).
* `children <Child[]>`: A list of childeren to spawn.
  * `<string>`: same as `/bin/sh`
  * `<string[]>`: same as `{spawn, exec:}`
  * ``

### Appmap-related Options

Each appmap may have 

* `enabled <boolean> | <Specifier[]>`: Indicates whether a node process should be recorded based on its main module's path. A boolean
* `hook-cjs <boolean>`: Indicates whether commonjs modules should be instrumented to record call/return events. *Default*: true.
* `hook-esm <boolean>`: Indicates whether native modules should be instrumented to record call/return events. *Default*: true. 
* `hook-http <boolean>`: Indicates whether the native modules `http` and `https` should be monkey-patched to record http traffic. *Default*: true.
* `escape-prefix`: The prefix of the variables used to store recording-related data. If variables from the program under recording starts with this prefix, the instrumentation will fail. *Default*: `"APPMAP"`.
* `packages`:
* `exclude <string[]>`: A list of name to always exclude from function

### Recording-related Options

* recording
* `class-map-pruning <boolean>`: Indicates whether all the code entities (ie elements of the `classMap` array) of a file should be pruned off if the file did not produce any call/return event. *Default*: `false`.
* `event-pruning <boolean>`: Indicates whether call/return events should be pruned off if they are not located .
* `output <string> | <object>`: Path of the directory where appmap files should be written. The name of the file is based on the `map-name` option if it is present. Else, it is based on the path of the main module. It is also possible to explicitly set the name of the file using the object form: `{"directory": "path/to/output", "file-name": "my-file-name"}`. Note that `.appmap.json` will appened to the provided 

If it is an object is may contain two string properties: `directory` and `file-name`. 
* `base <string> | <object>`: Path of the directory to which paths from the recording should be express relatively. If it is an object it should be of the form `{"directory": "path/to/base"}`. `"path/to/base"` is the same as `{directory:"path/to/base/"}`. *Default*: current working directory of the agent process.
* `app-name <string>`: Name of the app that is being recorded.
* `map-name <string>`: Name of the recording.
* `name <string>`: Synonym to `map-name`.

