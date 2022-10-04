const { URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

export const compileTrace = (configuration, messages) => ({
  head: configuration,
  body: messages,
});
