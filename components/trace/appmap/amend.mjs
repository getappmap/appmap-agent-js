const _Map = Map;

export default (dependencies) => {
  return {
    amend: (events) => {
      const map = new _Map();
      const output = [];
      for (const event of events) {
        const key = `${String(event.index)}/${event.type}`;
        if (map.has(key)) {
          const index = map.get(key);
          output[index] = {
            ...output[index],
            data: event.data,
          };
        } else {
          map.set(key, output.length);
          output.push(event);
        }
      }
      return output;
    },
  };
};
