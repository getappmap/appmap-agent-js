const { Set, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

import * as Astring from "astring";
import * as Acorn from "acorn";
const { logDebug, logDebugWhen } = await import(
  `../../log/index.mjs${__search}`
);
const { generateGet, createCounter, recoverMaybe } = await import(
  `../../util/index.mjs${__search}`
);
const { logError } = await import(`../../log/index.mjs${__search}`);
const { getConfigurationPackage } = await import(
  `../../configuration-accessor/index.mjs${__search}`
);
const { ExternalAppmapError } = await import(
  `../../error/index.mjs${__search}`
);
const { getSources } = await import(`../../source/index.mjs${__search}`);
const { visit } = await import(`./visit.mjs${__search}`);

const { generate: generateEstree } = Astring;
const { parse: parseAcorn } = Acorn;

const getHead = generateGet("head");
const getBody = generateGet("body");
const getURL = generateGet("url");

export const createInstrumentation = (configuration) => ({
  configuration,
  done: new Set(),
  counter: createCounter(0),
});

const parseEstree = (type, content, url) => {
  try {
    return parseAcorn(content, {
      allowHashBang: true,
      sourceType: type,
      allowAwaitOutsideFunction: type === "module",
      ecmaVersion: "latest",
      locations: true,
    });
  } catch (error) {
    logError("Failed to parse file %j as %s >> %O", url, type, error);
    throw new ExternalAppmapError("Failed to parse js file");
  }
};

export const instrument = (
  { configuration, done, counter },
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
    (configuration.hooks.eval.aliases.length === 0 &&
      configuration.hooks.apply === null)
  ) {
    logDebugWhen(
      excluded,
      "Not instrumenting file %j because it has no allowed sources",
      url,
    );
    logDebugWhen(
      !excluded,
      "Not instrumenting file %j because instrumentation hooks (apply and eval) are disabled",
      url,
    );
    return { url, content, sources };
  } else {
    logDebug("Instrumenting file %j", url);
    return {
      url,
      content: generateEstree(
        visit(parseEstree(type, content, url), {
          url,
          whitelist: new Set(sources.map(getURL)),
          eval: configuration.hooks.eval,
          apply: configuration.hooks.apply,
          mapping,
          counter,
        }),
      ),
      sources,
    };
  }
};
