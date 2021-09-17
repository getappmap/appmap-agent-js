const _Map = Map;

export default (dependencies) => {
  return {
    substituteErratum: (events) => {
      const map = new _Map();
      const output = [];
      for (const event of events) {
        if (event.type === "erratum") {
          const key = `${String(event.index)}/${event.data.type}`;
          if (map.has(key)) {
            const index = map.get(key);
            output[index] = {
              ...output[index],
              data: event.data.data,
            };
          }
        } else {
          map.set(`${String(event.index)}/${event.type}`, output.length);
          output.push(event);
        }
      }
      return output;
    },
  };
};
