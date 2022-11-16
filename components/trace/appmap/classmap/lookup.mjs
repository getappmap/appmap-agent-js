const {
  URL,
  String,
  Reflect: { ownKeys },
  Array: { isArray },
} = globalThis;

const { search: __search } = new URL(import.meta.url);

const { hasOwnProperty } = await import(`../../../util/index.mjs${__search}`);

const isPositionIncluded = (position, start_position, end_position) =>
  (position.line > start_position.line ||
    (position.line === start_position.line &&
      position.column >= start_position.column)) &&
  (position.line < end_position.line ||
    (position.line === end_position.line &&
      position.column <= end_position.column));

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
      return predicate(node) ? "" : null;
    } else {
      return null;
    }
  } else {
    return null;
  }
};
