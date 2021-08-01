
const VERSION = '1.6.0';

export default (dependencies) => {
  const {makeMetadata} = Metadata(dependencies);
  const {createClassmap, addClassmapFile, getClassmapData} = Classmap(dependencies);
  const {orderByGroup} = Group(dependencies);
  const {splitByTrack} = Track(dependencies);
  const {compileEvents} = Event(dependencies);
  return {
    manufactureTrace: (trace, configuration1) => {
      const classmap = createClassmap(configuration);
      for (const {type, data} of trace) {
        if (type === "file") {
          addClassmapFile(classmap, file);
        }
      }
      return splitByTrack(trace).map(({options, trace}) => {
        const configuration2 = extendConfiguration(configuration1, options, "/");
        const events = orderByGroup(trace);
        const routes = new _Set();
        for (const {type, data} of events) {
          if (type === "apply") {
            const {function:route} = data;
            routes.add(route);
          }
        }
        const {output:{filename}, main:{path}, map:{name:name1}, app:{name:name2}, repository:{package:{name:name3}}} = configuration2;
        return {
          name: filename || path || name1 || name2 || name3 || null,
          data: {
            version: VERSION,
            metadata: compileMetadata(configuration2),
            classMap: compileClassmap(classmap, routes),
            events: compileEventTrace(events),
          },
        };
      });
    },
  };
};
