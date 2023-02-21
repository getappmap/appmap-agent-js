import { logInfo } from "../../log/index.mjs";
import { parseSource } from "../../source/index.mjs";
import { lookupEstreePath } from "./lookup.mjs";
import {
  wrapRootEntityArray,
  registerEntityTree,
  hideMissingFunctionEntity,
  removeEmptyClassEntity,
  toClassmapEntity,
} from "./entity.mjs";
import { digestEstreeRoot } from "./digest.mjs";
import { compileExclusionArray } from "./exclusion.mjs";

const { Map, Set } = globalThis;

export const createModule = ({
  source,
  relative,
  inline,
  exclusions,
  shallow,
  pruning,
}) => {
  const estree = parseSource(source);
  const getExclusion = compileExclusionArray(exclusions);
  const context = {
    anonymous: "[anonymous]",
    relative,
    inline,
    shallow,
    source,
  };
  const entities = wrapRootEntityArray(
    digestEstreeRoot(estree, context),
    context,
  );
  const infos = new Map();
  for (const entity of entities) {
    registerEntityTree(entity, null, null, infos, getExclusion);
  }
  return {
    source,
    relative,
    inline,
    exclusions,
    shallow,
    pruning,
    estree,
    entities,
    infos,
    paths: new Set(),
  };
};

const isFunctionEstree = ({ type }) =>
  type === "ArrowFunctionExpression" ||
  type === "FunctionExpression" ||
  type === "FunctionDeclaration";

export const lookupModuleClosure = ({ estree, infos, paths }, position) => {
  const maybe_path = lookupEstreePath(estree, isFunctionEstree, position);
  if (maybe_path === null) {
    logInfo(
      "Could not find a function in %j at %j, will treat it as excluded.",
      estree.loc.filename,
      position,
    );
    return null;
  } else {
    /* c8 ignore start */
    const info = infos.has(maybe_path) ? infos.get(maybe_path) : null;
    if (info !== null) {
      paths.add(maybe_path);
    }
    return info;
    /* c8 ignore stop */
  }
};

export const getModuleRelativeUrl = ({ relative }) => relative;

export const toModuleClassmap = ({ entities, pruning, paths }) => {
  if (pruning) {
    entities = entities.map((entity) =>
      hideMissingFunctionEntity(entity, paths),
    );
    entities = entities.flatMap(removeEmptyClassEntity);
  }
  return entities.flatMap(toClassmapEntity);
};
