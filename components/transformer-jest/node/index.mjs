// https://github.com/facebook/jest/blob/ee63afcbe7904d18558d3cc40e0940804df3deb7/packages/jest-transform/src/ScriptTransformer.ts#L261

import { cwd } from "node:process";
import { createRequire } from "node:module";
import { noop, assert, hasOwnProperty } from "../../util/index.mjs";
import { convertPathToFileUrl } from "../../path/index.mjs";
import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { readFile } from "../../file/index.mjs";
import { toDirectoryUrl } from "../../url/index.mjs";
import {
  createFrontend,
  instrument,
  flushContent,
  extractMissingUrlArray,
} from "../../frontend/index.mjs";
import {
  openSocket,
  addSocketListener,
  sendSocket,
  isSocketReady,
} from "../../socket/index.mjs";

// TODO: Make a stateless agent.
// - counter to index references
// - counter to index events

const {
  Map,
  RegExp,
  encodeURIComponent,
  Object: { entries: toEntries },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const require = createRequire(toDirectoryUrl(convertPathToFileUrl(cwd())));

const flush = (frontend, socket) => {
  if (isSocketReady(socket)) {
    const content = flushContent(frontend);
    if (content !== null) {
      sendSocket(socket, content);
    }
  }
};

const loadTransformer = (specifier, options) => {
  let transformer = require(specifier);
  // This `default` indirection is not documented.
  // But some module bundlers (eg typescript)
  // wrap module exports in `default`.
  if (
    hasOwnProperty(transformer, "default") &&
    typeof transformer.default === "object" &&
    transformer.default !== null
  ) {
    transformer = transformer.default;
  }
  if (
    hasOwnProperty(transformer, "createTransformer") &&
    typeof transformer.createTransformer === "function"
  ) {
    transformer = transformer.createTransformer(options);
  }
  return transformer;
};

const loadDispatchingEntry = ([pattern, { specifier, options }]) => [
  new RegExp(pattern, "u"),
  {
    specifier,
    transformer: loadTransformer(specifier, options),
  },
];

const sanitizeSource = (source, specifier) => {
  // This is no documented by transformers can directly
  // return a string rather than an object.
  // This is the case for `ts-jest@27.1.4`.
  if (typeof source === "string") {
    return { code: source, map: null };
  } else {
    const { code = null, map = null } = source;
    assert(
      !logErrorWhen(
        typeof code !== "string",
        "Transformer at %j should return an object whose code property is a string, got: %o",
        specifier,
        code,
      ),
      "Transformer should return an object whose code property is a string",
      ExternalAppmapError,
    );
    return { code, map };
  }
};

const transform = (
  frontend,
  socket,
  source,
  path,
  { supportsStaticESM: is_module },
  { hooks: { esm, cjs } },
) => {
  // Unfortunately, Jest does not provide definitive information
  // on the type of script that is being given.
  // Hence we mirror its strategy which is a simple path extension check.
  // https://github.com/facebook/jest/blob/836157f4807893bb23a4758a60998fbd61cb184c/packages/jest-runtime/src/index.ts#L1176
  if (path.endsWith(".json")) {
    return source;
  } else if (is_module ? esm : cjs) {
    const url = convertPathToFileUrl(path);
    let { code: content, map: map_content = null } = source;
    const cache = new Map();
    if (map_content !== null) {
      if (typeof map_content !== "string") {
        map_content = stringifyJSON(map_content);
      }
      // Escaping `${"="}` to prevent c8 to choke on this literal.
      // https://github.com/bcoe/c8/blob/854f9f6c2ea36e583ea02fa3f8a850804e671df3/lib/source-map-from-file.js#L41
      content = `${content}\n//# sourceMappingURL${"="}data:text/json,${encodeURIComponent(
        map_content,
      )}`;
    }
    cache.set(url, content);
    let complete = false;
    while (!complete) {
      const urls = extractMissingUrlArray(frontend, url, cache);
      if (urls.length === 0) {
        complete = true;
      } else {
        for (const url of urls) {
          cache.set(url, readFile(url));
        }
      }
    }
    // const source_type = is_module ? "module" : "script";
    const content2 = instrument(frontend, url, cache);
    flush(frontend, socket);
    return {
      code: content2,
      map: null,
    };
  } else {
    return source;
  }
};

export const compileCreateTransformer = (configuration) => {
  // Only source messages will be send from the frontend.
  // As they are shared in the backend, session is a noop.
  const frontend = createFrontend({ ...configuration, session: "noop" });
  const socket = openSocket(configuration);
  addSocketListener(socket, "message", noop);
  addSocketListener(socket, "open", () => {
    flush(frontend, socket);
  });
  return (dispatching) => {
    const transformers = toEntries(dispatching).map(loadDispatchingEntry);
    return {
      canInstrument: false,
      process: (content, path, options) => {
        let source = { code: content, map: null };
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            assert(
              !logErrorWhen(
                !hasOwnProperty(transformer, "process"),
                "Transformer at %j should export `process`",
                specifier,
              ),
              "Transformer should export process",
              ExternalAppmapError,
            );
            source = sanitizeSource(
              transformer.process(content, path, options),
              specifier,
            );
            break;
          }
        }
        return transform(
          frontend,
          socket,
          source,
          path,
          options,
          configuration,
        );
      },
      processAsync: async (content, path, options) => {
        let source = { code: content, map: null };
        for (const [regexp, { specifier, transformer }] of transformers) {
          if (regexp.test(path)) {
            assert(
              !logErrorWhen(
                !hasOwnProperty(transformer, "process"),
                "Transformer at %j should export either `process` or `processAsync`",
                specifier,
              ),
              "Transformer should export either process or processAsync",
              ExternalAppmapError,
            );
            source = sanitizeSource(
              await transformer[
                hasOwnProperty(transformer, "processAsync")
                  ? "processAsync"
                  : "process"
              ](content, path, options),
            );
            break;
          }
        }
        return transform(
          frontend,
          socket,
          source,
          path,
          options,
          configuration,
        );
      },
    };
  };
};
