import Classmap from "./classmap.mjs";
import EventData from "./event-data.mjs";

const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
  } = dependencies;

  const { getClassmapClosure } = Classmap(dependencies);

  const { compileBeforeEventData, compileAfterEventData } =
    EventData(dependencies);

  const placeholders = new _Map([
    // bundle //
    ["begin/bundle", { type: "bundle" }],
    ["after/bundle", { type: "bundle" }],
    [
      "begin/apply",
      {
        type: "apply",
        function: null,
        this: {
          type: "string",
          print: "MANUFACTURED APPMAP THIS VALUE",
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
          print: "MANUFACTURED APPMAP RETURN VALUE",
        },
      },
    ],
    [
      "begin/response",
      {
        type: "response",
        protocol: "HTTP/1.1",
        method: "GET",
        path: "/MANUFACTURED/APPMAP/REQUEST",
        headers: {},
      },
    ],
    [
      "end/response",
      {
        type: "response",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
    // jump //
    ["before/jump", { type: "jump" }],
    ["after/jump", { type: "jump" }],
    [
      "before/query",
      {
        type: "query",
        database: "MANUFACTURED_APPMAP_DATABASE",
        version: null,
        sql: "SELECT * FROM MANUFACTURED_APPMAP_TABLE;",
        parameters: [],
      },
    ],
    [
      "after/query",
      {
        type: "query",
        error: { type: "null", print: "null" },
      },
    ],
    [
      "before/request",
      {
        type: "request",
        protocol: "HTTP/1.1",
        method: "GET",
        path: "/MANUFACTURED/APPMAP/REQUEST",
        headers: {},
      },
    ],
    [
      "after/request",
      {
        type: "request",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
  ]);

  const checkFinish = (frame) => {
    const {type} = frame;
    if (type === "jump") {
      const {after} = frame;
      assert(after !== null, "unfinished jump");
    } else {
      assert(type === "bundle", "invalid frame");
      const {end} = frame;
      assert(end !== null, "unfinished bundle");
    }
  };

  const orderByFrame = (events) => {
    const root = { type:"bundle", begin: null, between: [], end: null };
    const stack = [];
    let current = root;
    const map = new _Map();
    for (const event of events) {
      const { type, index } = event;
      if (type === "begin") {
        const frame = {
          type: "bundle",
          begin: event,
          between: [],
          end: null,
        };
        map.set(index, frame);
        stack.push(current);
        current = frame;
      } else if (type === "end" || type === "before") {
        const {begin, end, between} = current;
        const {index:begin_index} = begin;
        assert(begin_index === index, "bundle index mismatch");
        assert(end === null, "bundle frame has already ended");
        if (type === "end") {
          const {data:{type:begin_type}} = begin;
          assert(type === begin_type, "bundle type mismatch");
          between.map(checkFinish);
          current.end = event;
        } else {
          between.push({
            type: "jump",
            before: event,
            after: null
          });
        }
        const {length} = stack;
        assert(length > 0, "empty stack");
        current = stack.pop();
      } else if (type === "after") {
        assert(map.has(index), "missing frame for after event");
        stack.push(current);
        current = map.get(index);
        const {between} = current;
        const {length} = between;
        assert(length > 0, "after event expected something in between");
        const last = between[length - 1];
        const {type:last_type} = last;
        assert(last_type === "jump", "expected a jump");
        const {before, after} = last;
        const {data:{type:before_type}} = before;
        assert(type === before_type, "jump type mismatch");
        assert(after === null, "jump has already been used");
        last.after = event;
      } else {
        assert(false, "invalid event type");
      }
    }
    return root.between;
  };

  const createCallEvent = ({index, data}, event2, classmap) => ({
    id: 2 * index,
    event: "call",
    thread_id: 0,
    ...compileBeforeEventData(data, classmap),
  });

  const createReturnEvent = ({type:type1, index, time, data:{type:type2}}, event2, classmap) => ({
    id: 2 * index + 1,
    event: "return",
    thread_id: 0,
    parent_id: 2 * index,
    elapsed: event2 === null ? 0 : event2.time - time,
    ...compileAfterEventData(
      event2 === null ? placeholders.get(`${type1}/${type2}`) : event2.data,
      classmap
    ),
  });

  const isEmptyBundle = ({data:{type}}) => type === "bundle";

  const isEmptyJump = ({data:{type}}) => type === "jump";

  const isShallow = ({data}, classmap) => {
    const {type} = data;
    if (type === "apply") {
      const {route} = data;
      const {
        file: { shallow },
      } = getClassmapClosure(classmap, route);
      return shallow;
    }
    return false;
  };

  const compileTrace = (frames, classmap) => {
    const generateCompileFrame = (shallow) => (frame) => {
      const {type} = frame;
      if (type === "jump") {
        const {before, after} = frame;
        if (isEmptyJump(before)) {
          return [];
        }
        return [
          createCallEvent(before, after, classmap),
          createReturnEvent(before, after, classmap),
        ];
      }
      assert(type === "bundle", "invalid frame");
      const {begin, between, end} = frame;
      const next_shallow = isShallow(begin, classmap);
      const trace = between.flatMap(next_shallow ? compileShallowFrame : compileRegularFrame);
      if ((shallow && next_shallow) || isEmptyBundle(begin)) {
        return trace;
      }
      return [
        createCallEvent(begin, end, classmap),
        ... trace,
        createReturnEvent(begin, end, classmap),
      ];
    };
    const compileShallowFrame = generateCompileFrame(true);
    const compileRegularFrame = generateCompileFrame(false);
    return frames.flatMap(compileRegularFrame);
  }

  return {
    compileEventTrace: (events, classmap) => compileTrace(
      orderByFrame(events),
      classmap,
    ),
  };

};
