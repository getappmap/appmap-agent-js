import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";
import { hashFile } from "../../hash/index.mjs";
import {
  getUrlFilename,
  toAbsoluteUrl,
  toRelativeUrl,
} from "../../url/index.mjs";
import { logWarning } from "../../log/index.mjs";
import {
  createSource,
  toSourceClassmap,
  lookupSourceClosure,
  getSourceRelativeUrl,
} from "./source.mjs";

const { String, Map } = globalThis;

export const createClassmap = (configuration) => ({
  configuration,
  // Mapping from the hash of a file (url + content) to the associated source
  // object.
  sources: new Map(),
  // Mapping from url to counter to provide unique relative urls for function
  // entities.
  urls: new Map(),
  // Mapping from url to file hash to support url-based lookup. When a url is
  // mapped to null, it means that there is multiple different content for that
  // url. In other words, the source is dynamic.
  indirections: new Map(),
});

const toDynamicRelativeUrl = (url, index, base) =>
  toRelativeUrl(
    toAbsoluteUrl(`${getUrlFilename(url)}#${String(index)}`, url),
    base,
  );

export const addClassmapSource = (
  {
    configuration: {
      pruning,
      "function-name-placeholder": placeholder,
      repository: { directory },
      packages: specifiers,
      "default-package": default_specifier,
      exclude: global_exclusion_array,
      "inline-source": global_inline_source,
    },
    sources,
    indirections,
    urls,
  },
  { url, content },
) => {
  let relative = toRelativeUrl(url, directory);
  if (relative === null) {
    logWarning(
      "Ignoring %j because it could not be expressed relatively to %j",
      url,
      directory,
    );
  } else if (content === null) {
    logWarning("Ignoring %j because its content could not be loaded", url);
    indirections.set(url, null);
  } else {
    const hash = hashFile({ url, content });
    if (!sources.has(hash)) {
      const {
        "inline-source": local_inline_source,
        exclude: local_exclusion_array,
        shallow,
      } = lookupSpecifier(specifiers, url, default_specifier);
      // Disable url-based location because there are multiple source contents
      // for the same source url.
      if (indirections.has(url)) {
        const maybe_hash = indirections.get(url);
        if (maybe_hash !== null) {
          sources.set(
            maybe_hash,
            createSource({
              ...sources.get(maybe_hash),
              relative: toDynamicRelativeUrl(url, 0, directory),
            }),
          );
          indirections.set(url, null);
        }
      } else {
        indirections.set(url, hash);
      }
      if (urls.has(url)) {
        let counter = urls.get(url);
        counter += 1;
        urls.set(url, counter);
        relative = toDynamicRelativeUrl(url, counter, directory);
      } else {
        urls.set(url, 0);
      }
      sources.set(
        hash,
        createSource({
          url,
          content,
          relative,
          placeholder,
          pruning,
          inline: local_inline_source ?? global_inline_source,
          exclusions: [...global_exclusion_array, ...local_exclusion_array],
          shallow,
        }),
      );
    }
  }
};

export const lookupClassmapClosure = ({ sources, indirections }, location) => {
  // Prefer hash over url to support dynamic sources.
  if (location.hash !== null) {
    if (sources.has(location.hash)) {
      return lookupSourceClosure(sources.get(location.hash), location);
    } else {
      logWarning(
        "Ignoring closure at %j because its source is missing",
        location,
      );
      return null;
    }
  } else if (location.url !== null) {
    if (indirections.has(location.url)) {
      const hash = indirections.get(location.url);
      if (hash === null) {
        logWarning(
          "Ignoring closure at %j because its source is dynamic",
          location,
        );
        return null;
      } else {
        assert(sources.has(hash), "missing resolved hash", InternalAppmapError);
        return lookupSourceClosure(sources.get(hash), location);
      }
    } else {
      logWarning(
        "Ignoring closure at %j because its source is missing",
        location,
      );
      return null;
    }
  } else {
    throw new InternalAppmapError(
      "location should either be hash-based or url-based",
    );
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
  configuration: { pruning, "collapse-package-hierachy": collapse },
}) => {
  const root = [];
  for (const source of sources.values()) {
    const relative = getSourceRelativeUrl(source);
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
