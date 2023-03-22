import { assert } from "../../util/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { lookupUrl } from "../../matcher/index.mjs";
import {
  hashSource,
  resetSourceUrl,
  getSourceUrl,
  isSourceEmpty,
} from "../../source/index.mjs";
import { URL } from "../../url/index.mjs";
import { logWarning, logWarningWhen } from "../../log/index.mjs";
import { toSpecifier, splitSpecifierDirectory } from "./specifier.mjs";
import {
  createModule,
  resetModuleUrl,
  toModuleClassmap,
  lookupModuleClosure,
  getModuleUrl,
} from "./module.mjs";

const { String, Map } = globalThis;

export const createClassmap = (configuration) => ({
  configuration,
  // Mapping from the hash of a file (url + content) to the associated source
  // object.
  modules: new Map(),
  // Mapping from url to either:
  // - a number (its current index) if the source is dynamic
  // - a string (its hash) if the source is static
  urls: new Map(),
});

const setUrlHash = (url, hash) => {
  const url_obj = new URL(url);
  logWarningWhen(
    url_obj.hash !== "",
    "overwritting hash of %j with %j because it is a dynamic source",
    url,
    hash,
  );
  url_obj.hash = `#${hash}`;
  return url_obj.toString();
};

// Returns boolean indicating whether the source was ignored.
export const addClassmapSource = (
  {
    configuration: {
      repository: { directory: base },
      pruning,
      packages,
      "default-package": default_package,
      exclude: global_exclusion_array,
      "inline-source": global_inline_source,
    },
    modules,
    urls,
  },
  source,
) => {
  const url = getSourceUrl(source);
  if (isSourceEmpty(source)) {
    logWarning("Ignoring %j because its content could not be loaded", url);
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
      } = lookupUrl(packages, url, default_package);
      if (enabled) {
        if (urls.has(url)) {
          let resolution = urls.get(url);
          // The source was initially though to be static.
          if (typeof resolution === "string") {
            // Change the url of the inital module to a dynamic url.
            modules.set(
              resolution,
              resetModuleUrl(modules.get(resolution), setUrlHash(url, "0")),
            );
            resolution = 0;
          }
          resolution += 1;
          source = resetSourceUrl(source, setUrlHash(url, String(resolution)));
          urls.set(url, resolution);
        } else {
          urls.set(url, hash);
        }
        modules.set(
          hash,
          createModule({
            base,
            source,
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

export const lookupClassmapClosure = ({ modules, urls }, location) => {
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
    if (urls.has(location.url)) {
      const resolution = urls.get(location.url);
      if (typeof resolution === "number") {
        logWarning(
          "Ignoring closure at %j because its source is dynamic",
          location,
        );
        return null;
      } else if (typeof resolution === "string") {
        assert(
          modules.has(resolution),
          "missing resolved hash",
          InternalAppmapError,
        );
        return lookupModuleClosure(modules.get(resolution), location);
      } /* c8 ignore start */ else {
        throw new InternalAppmapError("invalid url resolution");
      } /* c8 ignore stop */
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

const registerPackageEntity = (entities, segment) => {
  const predicate = (entity) =>
    entity.type === "package" && entity.name === segment;
  if (!entities.some(predicate)) {
    entities.push({ type: "package", name: segment, children: [] });
  }
  return entities.find(predicate).children;
};

export const compileClassmap = ({
  modules,
  configuration: {
    repository: { directory: base },
    pruning,
    "collapse-package-hierachy": collapse,
  },
}) => {
  const root = [];
  for (const module of modules.values()) {
    const specifier = toSpecifier(getModuleUrl(module), base);
    const entities = toModuleClassmap(module);
    if (
      /* c8 ignore start */ !pruning ||
      entities.length > 0 /* c8 ignore stop */
    ) {
      if (collapse) {
        root.push({
          type: "package",
          name: specifier,
          children: entities,
        });
      } else {
        splitSpecifierDirectory(specifier)
          .reduce(registerPackageEntity, root)
          .push(...entities);
      }
    }
  }
  return root;
};
