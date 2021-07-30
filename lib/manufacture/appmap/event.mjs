
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

    // const flatenStackFast = (frames, length) => {
    //   const array = new Array(length);
    //   const loop = ({before, between, after}) => {
    //     if (before === null) {
    //
    //     }
    //     array.push(before);
    //     between.forEach(loop);
    //     if (after === null) {
    //
    //     }
    //     array.push(after);
    //   }
    //   frames.forEach(visit);
    //   return array;
    // };

    const orderByStack = (events) => {
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
