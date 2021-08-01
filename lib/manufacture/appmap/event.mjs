
export default (dependencies) => {

  const {log:{logWarning}} = dependencies;

  const placeholders = new _Map([
    ["before/apply", {
      type: "apply",
      function: null,
      this: {
        type: "string",
        truncated: false,
        value: "MANUFACTURED APPMAP APPLY EVENT"
      },
      arguments: [],
    }],
    ["after/apply", {
      type: "apply",
      error: null,
      result: {
        type: "string",
        truncated: false,
        value: "MANUFACTURED APPMAP RETURN EVENT"
      },
    }],
    ["before/query", {
      type: "query",
      database: "MANUFACTURED_APPMAP_QUERY_EVENT"
      sql: "SELECT * FROM table;",
      params: [],
    }],
    ["after/query", {
      type: "query",
    }],
    ["before/request", {
      type: "request",
      method: "GET",
      path: "/MANUFACTURED/APPMAP/REQUEST/EVENT",
      headers: {},
    }],
    ["after/request", {
      type: "request",
      status: 200,
      message: "MANUFACTURED-APPMAP-RESPONSE-EVENT",
      headers: {}
    }],
    ["before/response", {
      type: "response",
      method: "GET",
      path: "/MANUFACTURED/APPMAP/REQUEST/EVENT",
      headers: {},
    }],
    ["before/response", {
      type: "response",
      status: 200,
      message: "MANUFACTURED-APPMAP-RESPONSE-EVENT",
      headers: {}
    }],
  ]);

  const orderByFrame = (events) => {
    const root = [];
    let current = root;
    const map = new _Map();
    for (const event of events) {
      const {type, index} = event;
      if (map.has(index)) {
        const frame = map.get(index);
        assert(!map.has(frame, type), "duplicate event: %j", event);
        frame[type] = event;
        if (frame === current) {
          current = current.parent;
        }
      } else {
        const frame = {before:null, between:[], parent:current, after:null};
        frame[type] = event;
        current.between.push(frame);
        current = frame;
      }
    };
    return root;
  };

  const manufactureEvent = (kind, {index, group, time, data:{type}}) => ({
    type,
    index,
    group,
    time,
    data: placeholders.get(`${kind}/${type}`),
  });

  const compileFrameTrace = (frames, classmap) => {
    const output = [];
    const loop = ({before, between, after}) => {
      assert(before !== null || after !== null, "both before and after event should not be null");
      if (before === null) {
        logWarning("missing before event for %j", after);
        before = manufactureEvent("before", after);
      }
      const {time:time1, index:index1, data:data1} = before;
      output.push({
        {
          id: 2 * index1,
          event: "call",
          thread_id: 0,
          ...compileBeforeEvent(data1, classmap),
        },
      );
      between.forEach(loop);
      if (after === null) {
        logWarning("mising after event for %j", before);
        after = manufactureEvent("after", after);
      }
      const {time:time2, index:index2, data:data2} = after;
      output.push(compileAfterEvent({
        id: 2 * index2 + 1,
        event: "return",
        thread_id: 0,
        parent_id: 2 * index2,
        elapsed: time2 - time1,
        ... makeAfterEventData(data2, classmap),
      }));
    }
    frames.forEach(loop);
    return output;
  };

  return {
    compileEventTrace: (events, classmap) => compileFrameTrace(
      orderByFrame(events),
      classmap,
    ),
  };

};
