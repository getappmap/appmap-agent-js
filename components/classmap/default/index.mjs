import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { lookupSpecifier } from "../../specifier/index.mjs";
import {
  hashSource,
  getSourceUrl,
  isSourceEmpty,
} from "../../source/index.mjs";
import {
  getUrlFilename,
  toAbsoluteUrl,
  toRelativeUrl,
} from "../../url/index.mjs";
import { logWarning } from "../../log/index.mjs";
import {
  createModule,
  toModuleClassmap,
  lookupModuleClosure,
  getModuleRelativeUrl,
} from "./module.mjs";

const { String, Map } = globalThis;

export const createClassmap = (configuration) => ({
  configuration,
  // Mapping from the hash of a file (url + content) to the associated source
  // object.
  modules: new Map(),
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

// Returns boolean indicating whether the source was ignored.
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
    modules,
    indirections,
    urls,
  },
  source,
) => {
  const url = getSourceUrl(source);
  let relative = toRelativeUrl(url, directory);
  if (relative === null) {
    logWarning(
      "Ignoring %j because it could not be expressed relatively to %j",
      url,
      directory,
    );
    return false;
  } else if (isSourceEmpty(source)) {
    logWarning("Ignoring %j because its content could not be loaded", url);
    indirections.set(url, null);
    return false;
  } else {
    const hash = hashSource(source);
    if (modules.has(hash)) {
      return true;
    } else {
      const {
        "inline-source": local_inline_source,
        enabled,
        exclude: local_exclusion_array,
        shallow,
      } = lookupSpecifier(specifiers, url, default_specifier);
      if (enabled) {
        // Disable url-based location because there are multiple source contents
        // for the same source url.
        if (indirections.has(url)) {
          const maybe_hash = indirections.get(url);
          if (maybe_hash !== null) {
            modules.set(
              maybe_hash,
              createModule({
                ...modules.get(maybe_hash),
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
        modules.set(
          hash,
          createModule({
            source,
            relative,
            placeholder,
            pruning,
            inline:
              local_inline_source === null
                ? global_inline_source
                : local_inline_source,
            exclusions: [...local_exclusion_array, ...global_exclusion_array],
            shallow,
          }),
        );
        return true;
      } else {
        return false;
      }
    }
  }
};

export const lookupClassmapClosure = ({ modules, indirections }, location) => {
  // Prefer hash over url to support dynamic sources.
  if (location.hash !== null) {
    if (modules.has(location.hash)) {
      return lookupModuleClosure(modules.get(location.hash), location);
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
        assert(modules.has(hash), "missing resolved hash", InternalAppmapError);
        return lookupModuleClosure(modules.get(hash), location);
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
  modules,
  configuration: { pruning, "collapse-package-hierachy": collapse },
}) => {
  const root = [];
  for (const module of modules.values()) {
    const relative = getModuleRelativeUrl(module);
    const entities = toModuleClassmap(module);
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
