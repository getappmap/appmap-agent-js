const { Set, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import * as Astring from "astring";
import * as Acorn from "acorn";
const { logDebug } = await import(`../../log/index.mjs${__search}`);
const { generateGet, createCounter, recoverMaybe } = await import(
  `../../util/index.mjs${__search}`
);
const { getConfigurationPackage } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { getUUID } = await import(`../../uuid/index.mjs${__search}`);
const { expectSuccess } = await import(`../../expect/index.mjs${__search}`);
const { getSources } = await import(`../../source/index.mjs${__search}`);
const { visit } = await import(`./visit.mjs${__search}`);

const { generate: generateEstree } = Astring;
const { parse: parseEstree } = Acorn;

const getHead = generateGet("head");
const getBody = generateGet("body");
const getURL = generateGet("url");

export const createInstrumentation = (configuration) => ({
  configuration,
  runtime: `${configuration["hidden-identifier"]}${getUUID()}`,
  done: new Set(),
  counter: createCounter(0),
});

export const getInstrumentationIdentifier = ({ runtime }) => runtime;

export const instrument = (
  { configuration, runtime, done, counter },
  { type, url, content },
  mapping,
) => {
  let sources = getSources(mapping);
  sources = sources
    .map(({ url, content }) => {
      const {
        enabled,
        shallow,
        exclude,
        "inline-source": inline,
      } = getConfigurationPackage(configuration, url);
      logDebug(
        "%s source file %j",
        enabled ? "Instrumenting" : "Not instrumenting",
        url,
      );
      return {
        head: enabled,
        body: {
          url,
          content,
          shallow,
          inline: recoverMaybe(inline, configuration["inline-source"]),
          exclude: [...exclude, ...configuration.exclude],
        },
      };
    })
    .filter(getHead)
    .map(getBody);
  const excluded = sources.length === 0;
  sources = sources.filter(({ url }) => !done.has(url));
  for (const { url } of sources) {
    done.add(url);
  }
  if (
    excluded ||
    (configuration.hooks.eval.length === 0 && !configuration.hooks.apply)
  ) {
    logDebug(
      "Not instrumenting file %j because it has no allowed sources or because instrumentation hooks (apply and eval) are disabled.",
      url,
    );
    return { url, content, sources };
  } else {
    logDebug("Instrumenting file %j", url);
    return {
      url,
      content: generateEstree(
        visit(
          expectSuccess(
            () =>
              parseEstree(content, {
                allowHashBang: true,
                sourceType: type,
                allowAwaitOutsideFunction: type === "module",
                ecmaVersion: "latest",
                locations: true,
              }),
            "failed to parse file %j >> %O",
            url,
          ),
          {
            url,
            runtime,
            whitelist: new Set(sources.map(getURL)),
            evals: configuration.hooks.eval,
            apply: configuration.hooks.apply,
            mapping,
            counter,
          },
        ),
      ),
      sources,
    };
  }
};
