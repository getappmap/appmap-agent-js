import { logInfoWhen } from "../../../log/index.mjs";
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

const { Map, Set, String } = globalThis;

const hashPosition = ({ line, column }) => `${String(line)}:${String(column)}`;

export const createSource = (
  content,
  { url, relative, inline, exclusions, shallow, pruning },
) => {
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
  return { relative, estree, entities, infos, paths: new Map(), pruning };
};

const isFunctionEstree = ({ type }) =>
  type === "ArrowFunctionExpression" ||
  type === "FunctionExpression" ||
  type === "FunctionDeclaration";

const lookupCache = (position, estree, paths) => {
  const hashed_position = hashPosition(position);
  if (paths.has(hashed_position)) {
    return paths.get(hashed_position);
  } else {
    const maybe_path = lookupEstreePath(estree, isFunctionEstree, position);
    logInfoWhen(
      maybe_path === null,
      "Could not find a function in %j at %j, will treat it as excluded.",
      estree.loc.filename,
      position,
    );
    paths.set(hashed_position, maybe_path);
    return maybe_path;
  }
};

export const lookupSourceClosure = ({ estree, infos, paths }, position) => {
  const maybe_path = lookupCache(position, estree, paths);
  if (maybe_path !== null) {
    return infos.has(maybe_path) ? infos.get(maybe_path) : null;
  } else {
    return null;
  }
};

export const getSourceRelativeUrl = ({ relative }) => relative;

export const toSourceClassmap = ({ entities, pruning, paths }) => {
  if (pruning) {
    const used = new Set(paths.values());
    entities = entities.map((entity) =>
      hideMissingFunctionEntity(entity, used),
    );
    entities = entities.flatMap(removeEmptyClassEntity);
  }
  return entities.flatMap(toClassmapEntity);
};
