import Metadata from "./metadata.mjs";
import Track from "./track.mjs";
import Group from "./group.mjs";
import Classmap from "./classmap.mjs";
import Event from "./event.mjs";

const _Set = Set;
const VERSION = "1.6.0";

export default (dependencies) => {
  const {
    configuration: { extendConfiguration },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapFile, compileClassmap } =
    Classmap(dependencies);
  const { orderByGroup } = Group(dependencies);
  const { splitByTrack } = Track(dependencies);
  const { compileEventTrace } = Event(dependencies);
  return {
    compileTrace: (configuration1, messages, termination) => {
      const classmap = createClassmap(configuration1);
      for (const { type, data } of messages) {
        if (type === "file") {
          addClassmapFile(classmap, data);
        }
      }
      return splitByTrack(messages).map(({ options, messages }) => {
        const configuration2 = extendConfiguration(
          configuration1,
          options,
          "/",
        );
        const events = orderByGroup(messages);
        const routes = new _Set();
        for (const { data } of events) {
          const { type } = data;
          if (type === "apply") {
            const { function: route } = data;
            routes.add(route);
          }
        }
        const {
          output: { filename },
          main: { path },
          map: { name: name1 },
          app: { name: name2 },
          repository: {
            package: { name: name3 },
          },
        } = configuration2;
        return {
          name: filename || path || name1 || name2 || name3 || null,
          data: {
            version: VERSION,
            metadata: compileMetadata(configuration2, termination),
            classMap: compileClassmap(classmap, routes),
            events: compileEventTrace(events, classmap),
          },
        };
      });
    },
  };
};
