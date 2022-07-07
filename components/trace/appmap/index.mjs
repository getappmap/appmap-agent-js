import Metadata from "./metadata.mjs";
import Classmap from "./classmap/index.mjs";
import Event from "./event/index.mjs";
import Completion from "./completion.mjs";
import Amend from "./amend.mjs";
import Stack from "./stack.mjs";

const VERSION = "1.8.0";

export default (dependencies) => {
  const {
    log: { logDebug },
    "validate-appmap": { validateAppmap },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapSource, compileClassmap } =
    Classmap(dependencies);
  const { manufactureCompletion } = Completion(dependencies);
  const { orderByStack } = Stack(dependencies);
  const { compileEventTrace } = Event(dependencies);
  const { amend } = Amend(dependencies);
  return {
    compileTrace: (configuration, sources, events, termination) => {
      logDebug(
        "Trace:\n  configuration = %j\n  sources = %j\n  events = %j\n  termination = %j",
        configuration,
        sources,
        events,
        termination,
      );
      const classmap = createClassmap(configuration);
      for (const source of sources) {
        addClassmapSource(classmap, source);
      }
      events = amend(events);
      const routes = new Set();
      for (const event of events) {
        if (event.type === "begin" && event.data.type === "apply") {
          routes.add(event.data.function);
        }
      }
      events = manufactureCompletion(events);
      events = orderByStack(events);
      const appmap = {
        version: VERSION,
        metadata: compileMetadata(configuration, termination),
        classMap: compileClassmap(classmap, routes),
        events: compileEventTrace(events, classmap),
      };
      validateAppmap(appmap);
      return appmap;
    },
  };
};
