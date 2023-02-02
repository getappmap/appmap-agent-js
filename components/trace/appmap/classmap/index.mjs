import { InternalAppmapError } from "../../../error/index.mjs";
import { assert } from "../../../util/index.mjs";
import { toRelativeUrl } from "../../../url/index.mjs";
import { logWarning } from "../../../log/index.mjs";
import {
import {
  createSource,
  toSourceClassmap,
  lookupSourceClosure,
} from "./source.mjs";

const { Map } = globalThis;

export const createClassmap = (configuration) => ({
  sources: new Map(),
  configuration,
});

export const addClassmapSource = (
  {
    configuration: {
      pruning,
      "function-name-placeholder": placeholder,
      repository: { directory },
    },
    sources,
  },
  { url, content, inline, exclude: exclusions, shallow },
) => {
  assert(!sources.has(url), "duplicate source url", InternalAppmapError);
  sources.set(
    url,
    createSource(content, {
      url,
      directory,
      placeholder,
      pruning,
      inline,
      exclusions,
      shallow,
    }),
  );
};

export const lookupClassmapClosure = ({ sources }, location) => {
  if (sources.has(location.hash)) {
    return lookupSourceClosure(
      sources.get(base),
      location,
    );
  } else {
    logWarning(
      "Missing source file for closure at %s, threating it as excluded.",
      location,
    );
    return null;
  }
};

const registerPackageEntity = (entities, dirname) => {
  const predicate = (entity) =>
    entity.type === "package" && entity.name === dirname;
  if (!entities.some(predicate)) {
    entities.push({ type: "package", name: dirname, children: [] });
  }
  return entities.find(predicate).children;
};

export const compileClassmap = ({
  sources,
  configuration: {
    pruning,
    "collapse-package-hierachy": collapse,
    repository: { directory },
  },
}) => {
  const root = [];
  for (const [url, source] of sources) {
    const relative = toRelativeUrl(url, directory);
    const entities = toSourceClassmap(source);
    if (
      /* c8 ignore start */ !pruning ||
      entities.length > 0 /* c8 ignore stop */
    ) {
      if (collapse) {
        root.push({
          type: "package",
          name: relative,
          children: entities,
        });
      } else {
        const dirnames = relative.split("/");
        dirnames.pop();
        if (dirnames.length === 0) {
          dirnames.push(".");
        }
        dirnames.reduce(registerPackageEntity, root).push(...entities);
      }
    }
  }
  return root;
};
