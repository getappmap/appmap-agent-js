const { Buffer } = require("buffer");

const global_URL = URL;

module.exports = (instrumentModule) => (
  content,
  context,
  defaultTransformSource
) => {
  if (context.format !== "module") {
    return defaultTransformSource(content, context, defaultTransformSource);
  }
  if (typeof content !== "string") {
    content = Buffer.from(content).toString("utf8");
    // content = new global_TextDecoder().decode(content);
  }
  return new Promise((resolve, reject) => {
    instrumentModule(new global_URL(context.url).pathname, content, {
      resolve: (source) => resolve({ source }),
      reject,
    });
  });
};
