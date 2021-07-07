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
const global_Buffer = Buffer;
const global_URL = URL;

let instrument = null;

export const startHooking = ({instrument:_instrument}) => {
  instrument = _instrument;
};

export const stopHooking = () => {
  instrument = null;
};

export const transformSource = (
  content,
  context,
  defaultTransformSource,
) => {
  if (context.format === "module") {
    if (typeof content !== "string") {
      content = global_Buffer.from(content).toString("utf8");
      // content = new global_TextDecoder().decode(content);
    }
    if (instrument !== null) {
      content = instrument("module", new global_URL(context.url).pathname, content);
    }
  }
  return defaultTransformSource(content, context, defaultTransformSource);
};
