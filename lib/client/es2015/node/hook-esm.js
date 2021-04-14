const global_URL = URL;
const global_TextDecoder = TextDecoder;

module.exports = (instrumentModule) => (
  content,
  context,
  defaultTransformSource
) => {
  if (context.format !== "module") {
    return defaultTransformSource(content, context, defaultTransformSource);
  }
  if (typeof content !== "string") {
    content = new global_TextDecoder().decode(content);
  }
  return new Promise((resolve, reject) => {
    instrumentModule(new global_URL(context.url).pathname, content, {
      resolve: (source) => resolve({ source }),
      reject,
    });
  });
};