# Getting started with `appmap-agent-js`

`appmap-agent-js` is a JavaScript recording agent for the [AppMap](https://appland.org) framework.


## Introduction
 
`appmap-agent-js` records AppMaps from Node.js processes when they are run. There are two recommended strategies for recording AppMaps when getting started:

1. recording `mocha` test cases when they are run
2. recording Node.js processes using start/stop controls via http calls to web endpoints implemented by the agent that let users control the recording remotely

`appmap-agent-js` starts test and application processes to be recorded.


## Installation and setup

### Requirements

Supported platforms:
* Unix-like os, tested on Linux and macOS; Windows is currently not supported
* Node.js 14, 16, 17
* Express.js
* git is highly recommended 
* mocha >= 8.0.0 is requried for recording AppMaps from test cases (earlier versions do not support required root hooks)

**Please [open a new GitHub ticket](https://github.com/applandinc/appmap-agent-js/issues/new) if your application does not satisfy the criteria or if you experience any problems with the agent.**

### Installation

Run this command in your Node.js project folder (where `package.json` is located): 
```sh
npm install @appland/appmap-agent-js
```

We recommend installing the AppMap extension for popular code editors for remote recording, viewing and interacting with recorded AppMaps:
- [AppMap in VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=appland.appmap)
- [AppMap in JetBtains Marketplace](https://plugins.jetbrains.com/plugin/16701-appmap)

### Initial configuration

The agent requires a valid configuration in `appmap.yml` file:
1. Create a new file called `appmap.yml` in the project folder (where `package.json` is located)
2. Add your application name and a list of directories with sources that will be recorded. Example:

```yaml
name: MyApp
packages:
  - path: controllers
  - path: data
  - path: lib
  - path: models
  - path: routes
```


## Recording AppMaps

Once `appmap.yml` is configured for your project, you're ready to record AppMaps. 


### Recording mocha test cases:

1. Validate that the tests run prior to recording AppMaps
2. Run `appmap-agent-js` with the `mocha` command and its parameters following the `--` delimiter (all glob expressions should be wrapped in quotes), example:
```sh
npx appmap-agent-js -- mocha --recursive 'test/**/*.ts'
```
3. `appmap-agent-js` will run the tests. When they complete, the AppMaps will be stored in the default output directory `tmp/appmap/mocha`.


### Recording Node.js processes with remote recording:

1. Run `appmap-agent-js` with the application-starting command and its parameters following the `--` delimiter (all glob expressions should be wrapped in quotes), example:
```sh
npx appmap-agent-js -- node app/main.js -param1 hello --param2=world
```
2. `appmap-agent-js` will start the app and inject itself in its http stack. It will listen for [remote recording requests](https://appland.com/docs/reference/remote-recording) on all http ports of the application.
3. Start the remote recording:
    - [in VS Code](https://appland.com//docs/reference/remote-recording#visual-studio-code)
    - [in JetBrains IDEs](https://appland.com/docs/reference/remote-recording#jetbrains-intellij-pycharm-rubymine)
    - [with curl](https://appland.com/docs/reference/remote-recording.html#remote-recording-api)
4. Interact with your application or service to exercise code whitelisted in `appmap.yml`
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
  - `process` recorder records entire processes automatically, from start to finish. 
    - **Warning:** AppMaps recorded with the `process` recorder can be excessively large and noisy.
- `--command="_start command_"` : alternate method of specifying the app- or tests-starting command, wrapped in quotes
- `--log-level=[debug|info|warning|error]` :  defaults to `info`
- `--output-dir=_directory_` : location of recorded AppMap files, default is `tmp/appmap` or `tmp/appmap/mocha`


### Example

```
npx appmap-agent-js --recorder=mocha --command="mocha --recursive test/**/*.ts" --log-level=error
``` 

## Next steps

- View [`apppmap-agent-js` reference guide](./REFERENCE.md)
- Open [AppMap documentation](https://appland.com/docs/)