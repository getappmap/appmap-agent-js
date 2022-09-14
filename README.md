# Getting started with `appmap-agent-js`

`appmap-agent-js` is a JavaScript recording agent for the [AppMap](https://appland.org) framework.


## Introduction
 
`appmap-agent-js` records AppMaps from Node.js processes when they run. There are two recommended strategies for recording AppMaps when getting started:

1. Record `mocha` test cases when they run.
2. Record Node.js processes using start/stop controls via http calls to web endpoints. These are implemented by the AppMap agent to let users control the recording remotely.

`appmap-agent-js` starts the test and application processes that will be recorded.


## Installation and setup

### Requirements

Supported platforms:
* Mainstream os: linux distros, macOS, and windows
* Node.js: 14, 16, 17 (end-of-life), or 18
* Express.js: 4
* git is highly recommended
* mocha >= 8.0.0 is required for recording AppMaps from test cases (earlier versions do not support required root hooks)

**Please [open a new GitHub ticket](https://github.com/applandinc/appmap-agent-js/issues/new) if your application does not satisfy the criteria or if you experience any problems with the agent.**

### Installation

Run this command in your Node.js project folder (where `package.json` is located): 
```sh
npx @appland/appmap install
```

You will be guided through a series of steps for installing and configuring the agent.

To use remote recording, and view and interact with recorded AppMaps, we recommend installing the AppMap extension for popular code editors:
- [AppMap in VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=appland.appmap)
- [AppMap in JetBrains Marketplace](https://plugins.jetbrains.com/plugin/16701-appmap)

### Initial configuration

The agent requires a valid configuration in `appmap.yml` file. The `install` command creates a default `appmap.yml` 
file by scanning the project directories. We recommend that you review the generated `appmap.yml` file
and confirm your application name and a list of directories that will be recorded.

**For projects with JavaScript source maps**: add paths to sources to be recorded. For example:

```yaml
name: MyApp
packages:
  - path: src/server/controllers
  - path: src/server/data
  - path: src/server/lib
  - path: src/server/models
  - path: src/server/routes
```

**For projects without JavaScript source maps**: include build folders. For example:

```yaml
name: MyApp
packages:
  - path: dist/controllers
  - path: dist/data
  - path: dist/lib
  - path: dist/models
  - path: dist/routes
```

If you aren't sure which option to take, start with both source and build folders and optimize the `appmap.yml` file later. 


## Recording AppMaps

Once `appmap.yml` is configured for your project, you're ready to record AppMaps. 


### Recording mocha test cases:

1. Validate that the tests run prior to recording AppMaps.
2. Run `appmap-agent-js` with the `mocha` command and its parameters following the `--` delimiter. For example:
```sh
npx appmap-agent-js -- mocha test/**/*.ts
```
3. `appmap-agent-js` will run the tests. When the tests are complete, the AppMaps will be stored in the default output directory `tmp/appmap/mocha`.


### Recording Node.js processes with remote recording:

1. Run `appmap-agent-js` with the application-starting command and its parameters following the `--` delimiter. For example:
```sh
npx appmap-agent-js -- node app/main.js --param1 hello --param2=world
```
2. `appmap-agent-js` will start the app and inject itself in its http stack. It will listen for [remote recording requests](https://appland.com/docs/reference/remote-recording) on all http ports of the application.
3. Start the remote recording:
    - [in VS Code](https://appland.com//docs/reference/remote-recording#visual-studio-code)
    - [in JetBrains IDEs](https://appland.com/docs/reference/remote-recording#jetbrains-intellij-pycharm-rubymine)
    - [with curl](https://appland.com/docs/reference/remote-recording.html#remote-recording-api)
4. Interact with your application or service to exercise code included in `appmap.yml`
5. Stop the recording and save the new AppMap to disk.


## Viewing AppMaps

Recorded AppMap are saved as `.appmap.json` files in the project folders (default location: `tmp/appmap`.) 

Follow the documentation for your IDE to open the recorded `.appmap.json` files:
- [in VS Code](https://appland.com/docs/reference/vscode)
- [in JetBrains IDEs](https://appland.com/docs/reference/jetbrains)


## Frequently used parameters

The most frequently used `appmap-agent-js` parameters are:
- `--recorder=[mocha|remote|process]` : process recorder
  - default recorder is inferred from the starting command:
    - `mocha` if the the command contains `mocha`
    - `remote` in all other cases
  - `mocha` recorder records AppMaps from test cases automatically
  - `remote` recorder has to be started and stopped manually with http requests
  - `process` recorder records entire processes automatically, from start to finish 
    - **Warning:** AppMaps recorded with the `process` recorder can be excessively large and noisy.
- `--command="_start command_"` : alternate method of specifying the app- or tests-starting command, wrapped in quotes
- `--log-level=[debug|info|warning|error]` :  defaults to `info`
- `--log-file=_file_` : location of log file, defaults to `stderr` 
- `--appmap-dir=_directory_` : location of recorded AppMap files, default is `tmp/appmap`.

### Example

```
npx appmap-agent-js --recorder=mocha --command="mocha test/**/*.ts" --log-level=error
``` 

## Next steps

- [appmap-agent-js reference documentation](https://appland.com/docs/reference/appmap-agent-js.html)

