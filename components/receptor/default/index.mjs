const { Map, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { assert } = await import(`../../util/index.mjs${__search}`);
const ReceptorFile = await import(`../../receptor-file/index.mjs${__search}`);
const ReceptorHttp = await import(`../../receptor-http/index.mjs${__search}`);

const Recepters = new Map([
  ["remote", ReceptorHttp],
  ["process", ReceptorFile],
  ["mocha", ReceptorFile],
]);

export const minifyReceptorConfiguration = (configuration) => {
  assert(
    configuration.recorder !== null,
    "undefined recorder in configuration",
  );
  return Recepters.get(configuration.recorder).minifyReceptorConfiguration(
    configuration,
  );
};

export const openReceptorAsync = async (configuration) => ({
  recorder: configuration.recorder,
  receptor: await Recepters.get(configuration.recorder).openReceptorAsync(
    configuration,
  ),
});

export const closeReceptorAsync = async ({ recorder, receptor }) => {
  await Recepters.get(recorder).closeReceptorAsync(receptor);
};

export const adaptReceptorConfiguration = (
  { recorder, receptor },
  configuration,
) =>
  Recepters.get(recorder).adaptReceptorConfiguration(receptor, configuration);
