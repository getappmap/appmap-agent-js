# Getting started with `appmap-agent-js`

`appmap-agent-js` is a JavaScript recording agent for the [AppMap](https://appland.org) framework.


## Introduction
 
`appmap-agent-js` records AppMaps from Node.js processes when they are run. There are two recommended strategies for recording AppMaps when getting started:

1. recording `mocha` test cases when they are run
2. recording Node.js processes using start/stop controls provided by the AppMap agent:
    - with HTTP calls to web endpoints implemented by the agent that let users start/stop the recording remotely
    - with programmatic API that starts/stops the recording locally from the application code

`appmap-agent-js` starts all Node.js processes to be recorded.


## Installation and setup

### Requirements

Supported platforms:
* Unix-like os, tested on Linux and macOS; Windows is currently not supported
* Node.js 14, 16, 17, or 18
* Express.js
* git is highly recommended 
* mocha >= 8.0.0 is requried for recording AppMaps from test cases (earlier versions do not support required root hooks)

**Please [create a new GitHub ticket](https://github.com/applandinc/appmap-agent-js/issues/new) if your application does not satisfy the criteria or if you experience any problems with the agent.**

### Installation

Run this command in your Node.js project folder (where `package.json` is located): 
```sh
npm install @appland/appmap-agent-js
```


### Initial configuration

The agent requires a valid configuration in an `appmap.yml` file:

1. Create a new file in the project folder (where `package.json` is located)
2. Enter your application name and a list of directories with sources that will be recorded. Example:

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
2. Run `appmap-agent-js` with `mocha` command and its parameters following the `--` delimiter, example:
```sh
npx appmap-agent-js -- mocha --recursive test/**/*.ts
```
3. `appmap-agent-js` will run the tests. When they complete, the AppMaps will be stored in the default output directory `tmp/appmap/mocha`.


### Recording Node.js processes with remote recording:

1. Run the `appmap-agent-js` with the application start command and its parameters following the `--` delimiter, example:
```sh
npx appmap-agent-js -- node app/main.js -param1 hello --param2=world
```
2. `appmap-agent-js` will start the app and inject itself in its http stack. It will listen for [remote recording requests](https://appland.com/docs/reference/remote-recording) on all http ports of the application. Start the remote recording now:
    - [in JetBrains IDEs](/docs/reference/remote-recording#jetbrains-intellij-pycharm-rubymine)
    - [in VS Code](/docs/reference/remote-recording#visual-studio-code)
3. Interact with your application or service to exercise code whitelisted in `appmap.yml`
4. Stop the recording and save the new AppMap to disk.


## Viewing AppMaps

Follow the documentation for your IDE to open and interact with recorded`.appmap.json` files:
- [in JetBrains IDEs](https://appland.com/docs/reference/jetbrains)
- [in VS Code](https://appland.com/docs/reference/vscode)


## Basic parameters

The commonly used `appmap-agent-js` parameters are:
- `--recorder=[mocha|remote|process]` : process recorder 
  - default recorder is inferred from the start command parameter
    - `mocha` if the the command contains `mocha`
    - `remote` in all other cases
  - `mocha` recorder records AppMaps from test cases automaticlly
  - `remote` recorder needs to started and stopped manually
  - `process` recorder records entire processes automatically, start to finish. 
    - Warning: AppMaps recorded with the `process` recorder can be excessively large and noisy.
- `--command="_start command_"` : alternate method of specifying the start command
- `--log-level=[debug|info|warning|error]` :  default `info`
- `--output-dir=_directory_` : location of recorded AppMap files, default `tmp/appmap` or `tmp/appmap/mocha`
- `--app-port=_one of app's http ports_` : use to whitelist a specific http port for remote recording (for apps listening on multiple ports)

### Example

```
npx appmap-agent-js --recorder=mocha --command="mocha --recursive test/**/*.ts" --log-level=error
``` 

## Next steps

- Install the [AppMap extension for popular code editors](/docs/quickstart/)
- View the [`apppmap-agent-js` reference guide](./REFERENCE.md)