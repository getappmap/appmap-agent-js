const _Map = Map;
const _Error = Error;
const { entries: toEntries, fromEntries } = Object;

const levels = new _Map([
  ["logDebug", 1],
  ["logInfo", 2],
  ["logWarning", 3],
  ["logError", 4],
  ["logOff", 5],
]);

const get = (map, key) => {
  if (!map.has(key)) {
    throw new _Error("missing map key");
  }
  return map.get(key);
};

const noop = () => {};

export const levelLog = (log, min_level_name) => {
  const min_level = get(levels, min_level_name);
  return fromEntries(
    toEntries(log).map(([level_name, log]) => [
      level_name,
      get(levels, level_name) >= min_level ? log : noop,
    ]),
  );
};
