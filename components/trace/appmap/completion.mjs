const { MAX_SAFE_INTEGER } = Number;
const _Map = Map;

const type_map = new _Map([
  ["begin", "end"],
  ["end", "begin"],
  ["after", "before"],
  ["before", "after"],
]);

const data_map = new _Map([
  // bundle //
  [
    "begin/bundle",
    {
      type: "bundle",
    },
  ],
  [
    "end/bundle",
    {
      type: "bundle",
    },
  ],
  [
    "begin/apply",
    {
      type: "apply",
      function: null,
      this: {
        type: "string",
        print: "APPMAP-MANUFACTURED-BEGIN-APPLY",
      },
      arguments: [],
    },
  ],
  [
    "end/apply",
    {
      type: "apply",
      error: null,
      result: {
        type: "string",
        print: "APPMAP-MANUFACTURED-END-APPLY",
      },
    },
  ],
  [
    "begin/response",
    {
      type: "response",
      protocol: `HTTP/1.1`,
      method: "GET",
      headers: {},
      url: "APPMAP-MANUFACTURED-BEGIN-RESPONSE",
      route: null,
    },
  ],
  [
    "end/response",
    {
      type: "response",
      status: 200,
      message: "APPMAP-MANUFACTURED-END-RESPONSE",
      headers: {},
    },
  ],
  // jump //
  [
    "before/jump",
    {
      type: "jump",
    },
  ],
  [
    "after/jump",
    {
      type: "jump",
    },
  ],
  [
    "before/query",
    {
      type: "query",
      database: "database",
      version: null,
      sql: "SELECT 'APPMAP-MANUFACTURED-BEFORE-QUERY';",
      parameters: [],
    },
  ],
  [
    "after/query",
    {
      type: "query",
      error: { type: "string", print: "APPMAP-MANUFACTURED-AFTER-QUERY" },
    },
  ],
  [
    "before/request",
    {
      type: "request",
      protocol: "HTTP/1.1",
      method: "GET",
      url: "APPMAP-MANUFACTURED-BEFORE-REQUEST",
      headers: {},
    },
  ],
  [
    "after/request",
    {
      type: "request",
      status: 200,
      message: "APPMAP-MANUFACTURED-END-REQUEST",
      headers: {},
    },
  ],
]);

export default (dependencies) => {
  const {
    util: { assert, createCounter, decrementCounter },
  } = dependencies;
  const updateBundle = (bundles, event1, event2) => {
    let bundle;
    if (event1.type === "after" && bundles.has(event1.index)) {
      bundle = bundles.get(event1.index);
      bundles.delete(event1.index);
    } else {
      bundle = [];
    }
    bundle.push(event1, event2);
    bundles.set(event2.index, bundle);
  };
  const manufactureMatchEvent = ({
    type,
    index,
    time,
    data: { type: data_type },
  }) => ({
    type: type_map.get(type),
    index,
    time,
    data: data_map.get(`${type}/${data_type}`),
  });
  const generateManufacture = (type1, type2) => (index) => ({
    type: type1,
    index,
    time: 0,
    data: {
      type: type2,
    },
  });
  const manufactureBeginBundle = generateManufacture("begin", "bundle");
  const manufactureEndBundle = generateManufacture("end", "bundle");
  const manufactureBeforeJump = generateManufacture("before", "jump");
  const manufactureAfterJump = generateManufacture("after", "jump");
  return {
    manufactureCompletion: (events) => {
      const prefix = [];
      const bundles = new _Map();
      const stack = [];
      let counter = createCounter(MAX_SAFE_INTEGER);
      for (const event of events) {
        if (event.type === "begin" || event.type === "after") {
          stack.push(event);
        } else {
          assert(
            event.type === "end" || event.type === "before",
            "invalid event",
          );
          if (stack.length === 0) {
            const manufactured_event = manufactureAfterJump(
              decrementCounter(counter),
            );
            prefix.unshift(manufactured_event);
            stack.push(manufactured_event);
          }
          updateBundle(bundles, stack.pop(), event);
        }
      }
      const postfix = [];
      while (stack.length > 0) {
        const event = manufactureBeforeJump(decrementCounter(counter));
        postfix.push(event);
        updateBundle(bundles, stack.pop(), event);
      }
      const entrance = [];
      const exit = [];
      for (const bundle of bundles.values()) {
        const { length } = bundle;
        assert(
          length > 0 && length % 2 === 0,
          "expected at least two elements",
        );
        const first = bundle[0];
        const last = bundle[length - 1];
        for (let index = 1; index < length - 1; index += 2) {
          const before = bundle[index];
          const after = bundle[index + 1];
          assert(
            before.type === "before" &&
              after.type === "after" &&
              before.data.type === after.data.type,
            "invalid before/after pair",
          );
        }
        if (first.type === "after" && last.type === "before") {
          const index = decrementCounter(counter);
          entrance.push(
            manufactureBeginBundle(index),
            manufactureMatchEvent(first),
          );
          exit.push(manufactureMatchEvent(last), manufactureEndBundle(index));
        } else if (first.type === "after") {
          entrance.push(
            manufactureMatchEvent(last),
            manufactureMatchEvent(first),
          );
        } else if (last.type === "before") {
          exit.push(manufactureMatchEvent(last), manufactureMatchEvent(first));
        } else {
          assert(
            first.type === "begin" && last.type === "end",
            "invalid event",
          );
          assert(first.index === last.index, "begin/end index mismatch");
          assert(
            first.data.type === last.data.type,
            "begin/end data type mismatch",
          );
        }
      }
      return [...entrance, ...prefix, ...events, ...postfix, ...exit];
    },
  };
};
