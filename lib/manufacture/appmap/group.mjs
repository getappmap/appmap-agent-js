
export default (dependencies) => {
  const {assert:{assert}} = dependencies;
  // const flaten = (node) => isArray(node) ? node.flatMap(flaten) : [node];
  const flatenFast = (nodes, length) => {
    const array = new Array(length);
    const loop = (node) => {
      if (isArray(node)) {
        node.forEach(loop);
      } else {
        output.push(node);
      }
    };
    nodes.forEach(loop);
    return array;
  };
  const orderByGroup = (trace) => {
    const root = [];
    const map = new _Map();
    for (const {type, data} of trace) {
      if (type === "group") {
        const {index, parent} = data;
        const buffer = [];
        assert(!map.has(index), "duplicate group %j", index);
        map.set(index, buffer);
        (map.has(parent) ? map.get(parent) : root).push(buffer);
      } else if (type === "event") {
        const {group} = data;
        if (!map.has(group)) {
          const buffer = [];
          map.set(group, buffer);
          root.push(buffer);
        }
        map.get(group).push(data);
      }
    }
    return flatenFast(root);
  }
};





const manufactureStack = (events) => {




      if (map.has(group)) {
        map.get(group).push(data);
      } else {
        const buffer = [];
        map.set(group, buffer);
        root.push(buffer);
        buffer.
      }
      let buffer = map.get(group);
      if (buffer ==== undefined) {

      }
      buffer.push(data);
    }
      if (map.has(group)) {
        map.get(group).push(event);
      } else {
        const buffer = [];
        map.set(group, buffer);
        buffer.push(event)
      }
      buffer
    }

      map.set(group, []);
    } else {
      assert(type1 === "event");
    }
  }
  for (let event of events) {
    if (event.id > max) {
      max = event.id;
    }
  }
  for (let index1 = 0; index1 < length; index1 += 1) {
    const event1 = events[index1];
    if (event1.event === 'call') {
      stack.push(event1);
      if (
        Reflect.getOwnPropertyDescriptor(event1, 'child_thread_id') !==
        undefined
      ) {
        assert(
          index1 + 1 < length &&
            events[index1 + 1].event === 'return' &&
            events[index1 + 1].parent_id === event1.id,
          'expected asynchronous jump to be directly followed by its return',
        );
        const { child_thread_id } = event1;
        const child = events.filter(
          (event2, index2) =>
            index2 > index1 && event2.thread_id === child_thread_id,
        );
        if (child.length > 0) {
          events = [
            ...events.slice(0, index1 + 1),
            ...child,
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id !== child_thread_id,
            ),
          ];
        } else {
          stack.pop();
          events[index1] = null;
          index1 += 1;
          events[index1] = null;
        }
      }
    } else {
      assert(event1.event === 'return', 'invalid event %o', event1);
      const parent = stack.pop();
      const parent_id = parent.id;
      if (event1.parent_id !== parent_id) {
        const index2 = events.findIndex(
          (event2, index2) =>
            index2 > index1 &&
            event2.event === 'return' &&
            event2.parent_id === parent_id,
        );
        if (index2 === -1) {
          length += 1;
          events = [
            ...events.slice(0, index1),
            {
              thread_id: parent.thread_id,
              event: 'return',
              id: (max += 1),
              parent_id,
            },
            ...events.slice(index1),
          ];
        } else {
          const child_thread_id = events[index2].thread_id;
          events = [
            ...events.slice(0, index1),
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id === child_thread_id,
            ),
            event1,
            ...events.filter(
              (event2, index2) =>
                index2 > index1 && event2.thread_id !== child_thread_id,
            ),
          ];
        }
      }
    }
  }
  if (stack.length > 0) {
    events = [
      ...events,
      ...stack.reverse().map((parent) => ({
        thread_id: parent.thread_id,
        event: 'return',
        id: (max += 1),
        parent_id: parent.id,
      })),
    ];
  }
  return events.filter(isNotNull).map(resetThreadId);
};
