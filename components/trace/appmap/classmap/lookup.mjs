const {
  URL,
  String,
  Reflect: { ownKeys },
  Array: { isArray },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { logInfoWhen } = await import(`../../../log/index.mjs${__search}`);
const { hasOwnProperty } = await import(`../../../util/index.mjs${__search}`);

const isPositionIncluded = (position, start_position, end_position) =>
  (position.line > start_position.line ||
    (position.line === start_position.line &&
      position.column >= start_position.column)) &&
  (position.line < end_position.line ||
    (position.line === end_position.line &&
      position.column <= end_position.column));

const isPositionEqual = (position1, position2) =>
  position1.line === position2.line && position1.line === position2.line;

export const lookupEstreePath = (node, predicate, position) => {
  if (isArray(node)) {
    const { length } = node;
    for (let index = 0; index < length; index += 1) {
      const maybe_path = lookupEstreePath(node[index], predicate, position);
      if (maybe_path !== null) {
        return `/${String(index)}${maybe_path}`;
      }
    }
    return null;
  } else if (
    typeof node === "object" &&
    node !== null &&
    hasOwnProperty(node, "type")
  ) {
    if (isPositionIncluded(position, node.loc.start, node.loc.end)) {
      for (const key of ownKeys(node)) {
        // Fast track for well-known non-estree fields
        if (
          key !== "type" &&
          key !== "start" &&
          key !== "end" &&
          key !== "loc"
        ) {
          const maybe_path = lookupEstreePath(node[key], predicate, position);
          if (maybe_path !== null) {
            return `/${key}${maybe_path}`;
          }
        }
      }
      if (predicate(node)) {
        logInfoWhen(
          !isPositionEqual(node.loc.start, position),
          "Could not find a function in %j at %j, will use the function at %j instead.",
          node.loc.filename,
          position,
          node.loc.start,
        );
        return "";
      } else {
        return null;
      }
    } else {
      return null;
    }
  } else {
    return null;
  }
};
