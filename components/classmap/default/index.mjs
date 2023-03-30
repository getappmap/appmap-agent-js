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

const { String, Set, Map } = globalThis;

export const createClassmap = (configuration) => ({
  configuration,
  // Mapping from url to a module versions.
  // Module versions is a mapping from the hashed content
  // of the module to the internal representation of the
  // module.
  codebase: new Map(),
  // Set of url to differentiate between a missing source and a disabled source.
  disabled: new Set(),
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
    codebase,
    disabled,
  },
  source,
) => {
  const url = getSourceUrl(source);
  const {
    "inline-source": local_inline_source,
    enabled,
    exclude: local_exclusion_array,
    shallow,
  } = lookupUrl(packages, url, default_package);
  if (enabled) {
    if (isSourceEmpty(source)) {
      logWarning("Ignoring source %j because it could not be loaded", url);
      disabled.add(url);
      return false;
    } else {
      const hash = hashSource(source);
      if (!codebase.has(url)) {
        codebase.set(url, new Map());
      }
      const versions = codebase.get(url);
      if (versions.has(hash)) {
        return true;
      }
      if (versions.size > 0) {
        source = resetSourceUrl(source, setUrlHash(url, String(versions.size)));
        if (versions.size === 1) {
          const { value: previous_hash } = versions.keys().next();
          versions.set(
            previous_hash,
            resetModuleUrl(versions.get(previous_hash), setUrlHash(url, "0")),
          );
        }
      }
      versions.set(
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
    }
  } else {
    disabled.add(url);
    return false;
  }
};

export const lookupClassmapClosure = ({ codebase, disabled }, location) => {
  const { url, hash, ...position } = location;
  if (codebase.has(url)) {
    const versions = codebase.get(url);
    if (hash === null) {
      if (/* c8 ignore start */ versions.size === 0) {
        throw new InternalAppmapError("unexpected source without version");
      } /* c8 ignore stop */ else if (versions.size === 1) {
        return lookupModuleClosure(versions.values().next().value, position);
      } else {
        logWarning(
          "Ignoring closure at %j because its location is static but its source has multiple versions",
          location,
        );
        return null;
      }
    } else if (versions.has(hash)) {
      return lookupModuleClosure(versions.get(hash), position);
    } else {
      logWarning(
        "Ignoring closure at %j because its dynamic source is missing",
        location,
      );
      return null;
    }
  } else {
    logWarningWhen(
      !disabled.has(url),
      "Ignoring closure at %j because its source is missing",
      location,
    );
    return null;
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
  codebase,
  configuration: {
    repository: { directory: base },
    pruning,
    "collapse-package-hierachy": collapse,
  },
}) => {
  const root = [];
  for (const versions of codebase.values()) {
    for (const module of versions.values()) {
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
  }
  return root;
};
