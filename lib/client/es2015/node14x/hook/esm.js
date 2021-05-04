const { Buffer } = require("buffer");

const global_Error = Error;
const global_Promise = Promise;
const global_URL = URL;

let hook = null;

exports.start = (instrument) => {
  if (hook !== null) {
    throw new global_Error("esm modules are already hooked");
  }
  hook = instrument;
};

exports.stop = () => {
  if (hook === null) {
    throw new global_Error("esm modules are not yet hooked");
  }
  hook = null;
};

exports.transformSource = (
  content,
  context,
  defaultTransformSource
) => {
  if (context.format !== "module" || hook === null) {
    return defaultTransformSource(content, context, defaultTransformSource);
  }
  if (typeof content !== "string") {
    content = Buffer.from(content).toString("utf8");
    // content = new global_TextDecoder().decode(content);
  }
  return new global_Promise((resolve, reject) => {
    hook("module", new global_URL(context.url).pathname, content, {
      resolve: (source) => {
        resolve({ source });
      },
      reject,
    });
  });
};
