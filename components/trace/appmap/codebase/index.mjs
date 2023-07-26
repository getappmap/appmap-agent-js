import { InternalAppmapError } from "../../../error/index.mjs";
import { lookupUrl } from "../../../matcher/index.mjs";
import { logWarning, logWarningWhen } from "../../../log/index.mjs";
import {
  createSource,
  resolveClosurePosition,
  lookupClosurePosition,
  applyExclusionCriteria,
  exportClassmap as exportSourceClassmap,
} from "../../../source/index.mjs";
import { parseEstree } from "../../../parse/index.mjs";
import {
  toStaticSpecifier,
  toDynamicSpecifier,
  splitSpecifierDirectory,
} from "./specifier.mjs";

const { Set, Map, String } = globalThis;

/////////////
// factory //
/////////////

const registerFileUrl = (
  { url },
  codebase,
  disabled,
  {
    "inline-source": global_inline,
    exclude: global_criteria,
    packages: package_matcher_array,
    "default-package": default_package,
  },
) => {
  if (disabled.has(url)) {
    return false;
  } else if (codebase.has(url)) {
    return true;
  } else {
    const {
      enabled,
      exclude: criteria,
      "inline-source": inline,
      "source-type": source,
      parsing: plugins,
      shallow,
    } = lookupUrl(package_matcher_array, url, default_package);
    if (enabled) {
      codebase.set(url, {
        inline: inline === null ? global_inline : inline,
        criteria: [...criteria, ...global_criteria],
        shallow,
        parsing: { source, plugins },
        versions: new Map(),
      });
      return true;
    } else {
      disabled.add(url);
      return false;
    }
  }
};

const registerFile = ({ url, hash, content }, codebase) => {
  const { versions, criteria, parsing } = codebase.get(url);
  const version = String(versions.size);
  const source = createSource({
    url,
    content,
    program: parseEstree({ url, content }, parsing),
  });
  applyExclusionCriteria(source, criteria);
  versions.set(hash, { version, source });
};

export const createCodebase = (files, configuration) => {
  const codebase = new Map();
  const disabled = new Set();
  for (const file of files) {
    if (registerFileUrl(file, codebase, disabled, configuration)) {
      registerFile(file, codebase);
    }
  }
  const {
    repository: { directory: base },
    "collapse-package-hierachy": collapse,
    pruning,
  } = configuration;
  return {
    codebase,
    disabled,
    pruning,
    collapse,
    base,
  };
};

///////////
// query //
///////////

const completeClosure = (source, specifier, shallow, position) => {
  const maybe_resolved_position = resolveClosurePosition(source, position);
  if (maybe_resolved_position === null) {
    return null;
  } else {
    return {
      ...lookupClosurePosition(source, maybe_resolved_position),
      position: maybe_resolved_position,
      shallow,
      specifier,
    };
  }
};

export const lookupClosureLocation = (
  { codebase, disabled, base },
  location,
) => {
  const { url, hash, position } = location;
  if (codebase.has(url)) {
    const { shallow, versions } = codebase.get(url);
    if (/* c8 ignore start */ versions.size === 0) {
      throw new InternalAppmapError("unexpected source without version");
    } /* c8 ignore stop */ else if (versions.size === 1) {
      const {
        value: { source },
      } = versions.values().next();
      return completeClosure(
        source,
        toStaticSpecifier(url, base),
        shallow,
        position,
      );
    } else {
      if (hash === null) {
        logWarning(
          "Ignoring closure at %j because its source has multiple versions",
          location,
        );
        return null;
      } else {
        if (versions.has(hash)) {
          const { source, version } = versions.get(hash);
          return completeClosure(
            source,
            toDynamicSpecifier(url, base, version),
            shallow,
            position,
          );
        } else {
          logWarning(
            "Ignoring closure at %j because of source content mismatch",
            location,
          );
          return null;
        }
      }
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

////////////
// export //
////////////

const registerPackage = (entities, segment) => {
  const predicate = (entity) =>
    entity.type === "package" && entity.name === segment;
  if (!entities.some(predicate)) {
    entities.push({ type: "package", name: segment, children: [] });
  }
  return entities.find(predicate).children;
};

export const exportClassmap = ({ codebase, base, pruning, collapse }) => {
  const root = [];
  for (const [url, { inline, versions }] of codebase.entries()) {
    for (const { version, source } of versions.values()) {
      const specifier =
        versions.size === 1
          ? toStaticSpecifier(url, base)
          : toDynamicSpecifier(url, base, version);
      const children = exportSourceClassmap(source, {
        specifier,
        inline,
        pruning,
      });
      if (
        /* c8 ignore start */ !pruning ||
        children.length > 0 /* c8 ignore stop */
      ) {
        if (collapse) {
          root.push({
            type: "package",
            name: specifier,
            children,
          });
        } else {
          splitSpecifierDirectory(specifier)
            .reduce(registerPackage, root)
            .push(...children);
        }
      }
    }
  }
  return root;
};
