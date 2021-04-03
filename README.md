# appmap-agent-js

JavaScript client agent for the AppMap framework

To install:
```sh
npm install @appland/appmap-agent-js
```

To run:
```sh
npx appmap 

APPMAP_OUTPUT_DIR=. npx appmap -- standalone-file.js argv0 argv1
```

```sh
npx appmap inline --ecmascript 2020 --channel=inline --prefix FOOBAR -- 
npx appmap fork ...
npx appmap http-server --config=appmap.yml
npx appmap http-client --ecmascript 2020 --prefix FOOBAR --channel inline

node --experimental-loader mjs-{ecma}-node-{channel}.mjs main.js
node --require cjs-{ecma}-node-{channel}.mjs main.js


# npx --node-options "--require cjs-{ecma}-node-{channel}.mjs"
# npx --node-options "--experimental-loader mjs-{ecma}-node-{channel}.mjs" appmap
```

```