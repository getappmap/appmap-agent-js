import Classmap from "./classmap.mjs";
import EventData from "./event-data.mjs";

const _Map = Map;

export default (dependencies) => {
  const {
    util: { assert },
    log: { logWarning },
  } = dependencies;

  const { getClassmapClosure } = Classmap(dependencies);

  const { compileBeforeEventData, compileAfterEventData } =
    EventData(dependencies);

  const placeholders = new _Map([
    [
      "before/apply",
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
      "after/apply",
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
    [
      "before/response",
      {
        type: "response",
        protocol: "HTTP/1.1",
        method: "GET",
        path: "/MANUFACTURED/APPMAP/REQUEST",
        headers: {},
      },
    ],
    [
      "before/response",
      {
        type: "response",
        status: 200,
        message: "MANUFACTURED-APPMAP-RESPONSE",
        headers: {},
      },
    ],
    ["before/test", { type: "test" }],
    ["after/test", { type: "test" }],
  ]);

  const collapseShallow = (frames, shallow1, classmap) =>
    frames.flatMap(({ before, between, after }) => {
      let shallow2 = false;
      if (before !== null) {
        const { data } = before;
        const { type } = data;
        if (type === "apply") {
          const { function: route } = data;
          ({
            file: { shallow: shallow2 },
          } = getClassmapClosure(classmap, route));
        }
      }
      if (shallow1 && shallow2) {
        return collapseShallow(between, true, classmap);
      }
      return [
        {
          before,
          between: collapseShallow(between, shallow2, classmap),
          after,
        },
      ];
    });

  const orderByFrame = (events) => {
    const root = { before: null, between: [], after: null };
    let current = root;
    const map = new _Map();
    for (const event of events) {
      const { type, index } = event;
      if (map.has(index)) {
        const frame = map.get(index);
        assert(frame[type] === null, "duplicate event");
        frame[type] = event;
        if (frame === current) {
          current = current.parent;
        }
      } else {
        const frame = {
          before: null,
          between: [],
          parent: current,
          after: null,
        };
        map.set(index, frame);
        frame[type] = event;
        current.between.push(frame);
        current = frame;
      }
    }
    return root.between;
  };

  const manufactureEvent = (
    type1,
    { index, group, time, data: { type: type2 } },
  ) => ({
    type: type1,
    index,
    group,
    time,
    data: placeholders.get(`${type1}/${type2}`),
  });

  const compileFrameTrace = (frames, classmap) => {
    const output = [];
    const loop = ({ before, between, after }) => {
      assert(
        before !== null || after !== null,
        "both before and after event should not be null",
      );
      if (before === null) {
        logWarning("missing before event for %j", after);
        before = manufactureEvent("before", after);
      }
      const { time: time1, index: index1, data: data1 } = before;
      output.push({
        id: 2 * index1,
        event: "call",
        thread_id: 0,
        ...compileBeforeEventData(data1, classmap),
      });
      between.forEach(loop);
      if (after === null) {
        logWarning("mising after event for %j", before);
        after = manufactureEvent("after", before);
      }
      const { time: time2, index: index2, data: data2 } = after;
      output.push({
        id: 2 * index2 + 1,
        event: "return",
        thread_id: 0,
        parent_id: 2 * index2,
        elapsed: time2 - time1,
        ...compileAfterEventData(data2, classmap),
      });
    };
    frames.forEach(loop);
    return output;
  };

  return {
    compileEventTrace: (events, classmap) =>
      compileFrameTrace(
        collapseShallow(orderByFrame(events), false, classmap),
        classmap,
      ),
  };
};
