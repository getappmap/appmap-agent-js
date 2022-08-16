const _Map = Map;
const _Error = Error;
const { entries: toEntries, fromEntries } = Object;

const levels = new _Map([
  ["Debug", 1],
  ["Info", 2],
  ["Warning", 3],
  ["Error", 4],
  ["Off", 5],
]);

const get = (map, key) => {
  if (!map.has(key)) {
    throw new _Error("missing map key");
  }
  return map.get(key);
};

const noop = () => {};

// const returnNoop = () => () => {};

export const levelLog = (logs, min_level_name) => {
  const min_level = get(levels, min_level_name);
  return fromEntries(
    toEntries(logs).flatMap(([method_name, log]) => {
      const level_name = method_name.substring(3);
      return [
        [`log${level_name}`, get(levels, level_name) >= min_level ? log : noop],
        [
          `logGuard${level_name}`,
          get(levels, level_name) >= min_level
            ? (guard, ...args) => {
                if (guard) {
                  log(...args);
                }
              }
            : noop,
        ],
        // [
        //   `bindLog${level_name}`,
        //   get(levels, level_name) >= min_level
        //     ? (...xs) => (...ys) => {
        //       log(xs.concat(ys));
        //     }
        //     : returnNoop,
        // ],
      ];
    }),
  );
};
