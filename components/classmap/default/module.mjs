import { logInfo } from "../../log/index.mjs";
import { parseEstree } from "./parse.mjs";
import { lookupEstreePath } from "./lookup.mjs";
import {
  wrapRootEntityArray,
  excludeEntity,
  registerFunctionEntity,
  hideMissingFunctionEntity,
  removeEmptyClassEntity,
  toClassmapEntity,
} from "./entity.mjs";
import { digestEstreeRoot } from "./digest.mjs";
import { compileExclusionArray } from "./exclusion.mjs";

const { Map, Set } = globalThis;

export const createModule = ({
  url,
  content,
  relative,
  inline,
  exclusions,
  shallow,
  pruning,
}) => {
  const estree = parseEstree(url, content);
  const getExclusion = compileExclusionArray(exclusions);
  const context = {
    anonymous: "[anonymous]",
    relative,
    inline,
    shallow,
    content,
  };
  const entities = wrapRootEntityArray(
    digestEstreeRoot(estree, context),
    context,
  ).flatMap((entity) => excludeEntity(entity, null, getExclusion));
  const infos = new Map();
  for (const entity of entities) {
    registerFunctionEntity(entity, null, infos);
  }
  return {
    url,
    content,
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
    paths.add(maybe_path);
    return infos.has(maybe_path) ? infos.get(maybe_path) : null;
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
