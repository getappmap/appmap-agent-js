import Buffer from "buffer";
import { assert } = from "../../../util/index.mjs";

// TODO: detect if preloaded with `--experimental-loader`
// NB: since 15.x we can use module.preloading
// const preloaded = Path.join(__dirname, "esm.js") in require.cache;
// preloaded ? : {hookESM: (instrumentAsync) => {
//   throw new Error("lib/client/hook/esm.js must be preloaded with --experimental loader");
// }};

const global_Promise = Promise;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;
const global_URL = URL;

let instrumentModuleAsync = (path, content) =>
  global_Reflect_apply(global_Promise_resolve, global_Promise, [
    { source: content },
  ]);

export const hookESM = (options, closure) => {
  let save = instrumentModuleAsync;
  instrumentModuleAsync = (path, content) =>
    closure(path, content).then((content) => save(path, content));
  return () => {
    assert(save !== null, "this esm hook has already been stopped");
    instrumentModuleAsync = save;
    save = null;
  };
};

export const transformSource = (
  content,
  context,
  defaultTransformSource,
  ...rest
) => {
  /* c8 ignore start */
  if (context.format !== "module") {
    return defaultTransformSource(content, context, defaultTransformSource);
  }
  /* c8 ignore stop */
  if (typeof content !== "string") {
    content = Buffer.from(content).toString("utf8");
    // content = new global_TextDecoder().decode(content);
  }
  return instrumentModuleAsync(new global_URL(context.url).pathname, content);
};
