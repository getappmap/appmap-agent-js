
## Problem

The agent is using `--experimental-loader` node CLI option to instrument ESM modules.
As far as I know, this the only way to modify the code of ESM modules.
Unfortunately (first), this option toggles the default loader from CJS to ESM.

https://github.com/nodejs/node/blob/8c3637cd35cca352794e2c128f3bc5e6b6c41380/lib/internal/modules/run_main.js#L27

And this loader does not like missing file extension.
For instance this works:

```txt
> node node_modules/mocha/bin/mocha
```

But this does not:

```txt
> node --experimental-loader=./yo.mjs node_modules/mocha/bin/mocha
(node:23171) ExperimentalWarning: --experimental-loader is an experimental feature. This feature could change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
yo
node:internal/errors:464
    ErrorCaptureStackTrace(err);
    ^

TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension "" for /Users/soft/Desktop/workspace/appmap-agent-js/node_modules/mocha/bin/mocha
```

Unfortunately (second), many popular modules do not provide file extensions in their bin directory.
Hence, this is a rather serious limitation.

## GitHub Issues

https://github.com/nodejs/node/issues/41465
https://github.com/nodejs/node/issues/33226
https://github.com/nodejs/node/issues/41275

## Solution 1

Monkey-patch `Module.runMain` as in [abomination.js](lib/node/abomination.js).

## Solution 2

Fortunately these files are rarely called directly.
On unix system, it is symbolic links in `node_modules/.bin` that are called.
These links are referencing the often extension-less files which cause the aforementioned problem.
So I was able to change the target of these links to reference a cloned file with extension -- cf [legacy-abomination.js](doc/blob//abomination/legacy-abomination.js).

Unfortunately (third) this solution is not applicable on windows.
On windows, the files on `node_modules/.bin` are shell files which refer to the potentially extension-less files.

```sh
#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
  *CYGWIN*|*MINGW*|*MSYS*) basedir=`cygpath -w "$basedir"`;;
esac

if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/../mocha/bin/mocha" "$@"
else
  exec node  "$basedir/../mocha/bin/mocha" "$@"
fi
```
