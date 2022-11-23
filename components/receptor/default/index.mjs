const { Map, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import * as ReceptorFile from "../../receptor-file/index.mjs";
import * as ReceptorHttp from "../../receptor-http/index.mjs";

const Recepters = new Map([
  ["remote", ReceptorHttp],
  ["process", ReceptorFile],
  ["mocha", ReceptorFile],
]);

export const minifyReceptorConfiguration = (configuration) => {
  assert(
    configuration.recorder !== null,
    "undefined recorder in configuration",
    InternalAppmapError,
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
