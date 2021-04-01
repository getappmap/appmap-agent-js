const global_URL = URL;
const global_TextDecoder = TextDecoder;

module.exports = (instrumentModule) => (content, context, defaultTransformSource) => new Promise((resolve, reject) => {
  if (context.format === "module") {
    if (typeof content !== 'string') {
      content = (new global_TextDecoder()).decode(content);
    }
    instrumentModule(content, new global_URL(context.url).pathname, {
      resolve,
      reject,
    });
  } else {
    defaultTransformSource(content, context, defaultTransformSource).then(resolve, reject);
  }
});
