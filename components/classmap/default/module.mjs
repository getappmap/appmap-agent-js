import { logInfo } from "../../log/index.mjs";
import {
  parseSource,
  getSourceUrl,
  resetSourceUrl,
} from "../../source/index.mjs";
import {
  wrapRootEntityArray,
  registerEntityTree,
  hideMissingFunctionEntity,
  removeEmptyClassEntity,
  toClassmapEntity,
} from "./entity.mjs";
import { digestEstreeRoot } from "./digest.mjs";
import {
  parsePosition,
  stringifyPosition,
  measurePositionDistance,
} from "./position.mjs";
import { compileExclusionArray } from "./exclusion.mjs";

const { Map, Set } = globalThis;

const MAXIMUM_LOOKUP_DISTANCE = measurePositionDistance(
  { line: 0, column: 0 },
  { line: 5, column: 50 },
);

export const createModule = ({
  base,
  source,
  inline,
  exclusions,
  shallow,
  pruning,
}) => {
  const estree = parseSource(source);
  const getExclusion = compileExclusionArray(exclusions);
  const context = {
    base,
    anonymous: "[anonymous]",
    url: getSourceUrl(source),
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
    base,
    source,
    inline,
    exclusions,
    shallow,
    pruning,
    estree,
    entities,
    infos,
    references: new Set(),
  };
};

export const resetModuleUrl = (module, url) =>
  createModule({
    ...module,
    source: resetSourceUrl(module.source, url),
  });

export const lookupModuleClosure = (
  {
    estree: {
      loc: { filename },
    },
    infos,
    references,
  },
  position,
) => {
  const position_string = stringifyPosition(position);
  if (infos.has(position_string)) {
    const info = infos.get(position_string);
    if (info !== null) {
      references.add(position_string);
    }
    return info;
  } else {
    let best_distance = MAXIMUM_LOOKUP_DISTANCE;
    let best_position = null;
    let best_info = null;
    for (const [candidate_position_string, candidate_info] of infos) {
      const candidate_position = parsePosition(candidate_position_string);
      const candidate_distance = measurePositionDistance(
        position,
        candidate_position,
      );
      if (candidate_distance < best_distance) {
        best_distance = candidate_distance;
        best_position = candidate_position;
        best_info = candidate_info;
      }
    }
    if (best_position === null) {
      logInfo(
        "Could not find a function in %j at %j, will treat it as excluded.",
        filename,
        position,
      );
      return null;
    } else {
      logInfo(
        "Could not find a function in %j at %j, will use the function at %j instead",
        filename,
        position,
        best_position,
      );
      if (best_info !== null) {
        references.add(stringifyPosition(best_position));
      }
      return best_info;
    }
  }
};

export const getModuleUrl = ({ source }) => getSourceUrl(source);

export const toModuleClassmap = ({ entities, pruning, references }) => {
  if (pruning) {
    entities = entities.map((entity) =>
      hideMissingFunctionEntity(entity, references),
    );
    entities = entities.flatMap(removeEmptyClassEntity);
  }
  return entities.flatMap(toClassmapEntity);
};
