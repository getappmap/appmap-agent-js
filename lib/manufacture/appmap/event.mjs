
export default () => {

  const serializeParameter = (serial, name) => {
    const {type} = serial;
    let object_id = null;
    let _class = null;
    let value = null;
    if (type === "") {

    }
  }
    name,
    object_id:
  });

  const serializeException

  return {
    createBeforeTime: (events) => {
      const map = new _Map();
      for (let {type, index, time} of events) {
        if (type === "before") {
          assert(!map.has(index), "duplicate event index: %j", index);
          map.set(index, time);
        }
      }
      return map;
    }
    makeEvent: ({
      type,
      index,
      data,
      time,
    }, index, classmap, times) => {
      if (type === "before") {
        return {
          id: 2 * index,
          event: "call",
          thread_id: 1,
          receiver:
        }
      } else {
        assert(type === "after", "invalid event type: %j", type);
        return {
          id: 2 * index + 1,
          event: "return",
          thread_id: 1,
          parent_id: 2 * index,
          elapsed: times.get(2 * index) - time,
        };
      }
    });
  };

};
