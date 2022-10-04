const { Error, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { mapMaybe, createCounter, incrementCounter } = await import(
  `../../../util/index.mjs${__search}`
);
const { getClassmapClosure } = await import(`../classmap/index.mjs${__search}`);
const { digestPayload } = await import(`./payload.mjs${__search}`);

const digestEventPair = (event1, event2, id1, id2, info) => [
  {
    event: "call",
    thread_id: 0,
    id: id1,
    ...digestPayload(event1.payload, info),
  },
  {
    event: "return",
    thread_id: 0,
    id: id2,
    parent_id: id1,
    elapsed: (event2.time - event1.time) / 1000,
    ...digestPayload(event2.payload, info),
  },
];

export const digestEventTrace = (root, classmap) => {
  const counter = createCounter(0);
  const getClosureInfo = (location) => getClassmapClosure(classmap, location);
  /* eslint-disable no-use-before-define */
  const digestTransparentBundle = ({ children }, _info) =>
    children.flatMap(loop);
  /* eslint-enable no-use-before-define */
  const digestShallowBundle = ({ begin, end }, info) =>
    digestEventPair(
      begin,
      end,
      incrementCounter(counter),
      incrementCounter(counter),
      info,
    );
  /* eslint-disable no-use-before-define */
  const digestDeepBundle = ({ begin, children, end }, info) => {
    const id1 = incrementCounter(counter);
    const digest = children.flatMap(loop);
    const id2 = incrementCounter(counter);
    const [event1, event2] = digestEventPair(begin, end, id1, id2, info);
    digest.unshift(event1);
    digest.push(event2);
    return digest;
  };
  /* eslint-enable no-use-before-define */
  const loop = (node) => {
    if (node.type === "bundle") {
      const {
        begin: {
          payload: { type },
        },
      } = node;
      if (type === "bundle" || type === "group") {
        return digestTransparentBundle(node, null);
      } else if (type === "apply") {
        const info = mapMaybe(node.begin.payload.function, getClosureInfo);
        if (info === null) {
          return digestTransparentBundle(node, info);
        } else if (info.shallow) {
          return digestShallowBundle(node, info);
        } else {
          return digestDeepBundle(node, info);
        }
      } else {
        return digestDeepBundle(node, null);
      }
    } else if (node.type === "jump") {
      const { before, after } = node;
      const {
        payload: { type },
      } = before;
      if (type === "jump" || type === "await" || type === "yield") {
        return [];
      } else {
        return digestEventPair(
          before,
          after,
          incrementCounter(counter),
          incrementCounter(counter),
          null,
        );
      }
    } /* c8 ignore start */ else {
      throw new Error("invalid node type");
    } /* c8 ignore stop */
  };
  return root.flatMap(loop);
};
