const { Buffer } = require("buffer");
const { strict: Assert } = require("assert");

const global_Promise = Promise;
const global_Reflect_apply = Reflect.apply;
const global_Promise_resolve = Promise.resolve;
const global_URL = URL;

let instrumentAsync = (source, path, content) =>
  global_Reflect_apply(global_Promise_resolve, global_Promise, [
    { source: content },
  ]);

exports.hookESM = (closure) => {
  let save = instrumentAsync;
  instrumentAsync = (source, path, content) =>
    closure(source, path, content).then((content) =>
      save(source, path, content)
    );
  return () => {
    Assert.notEqual(save, null);
    instrumentAsync = save;
    save = null;
  };
};

exports.transformSource = (
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
  return instrumentAsync(
    "module",
    new global_URL(context.url).pathname,
    content
  );
};
