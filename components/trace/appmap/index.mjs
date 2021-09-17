import Metadata from "./metadata.mjs";
import Classmap from "./classmap.mjs";
import Event from "./event/index.mjs";
import Completion from "./completion.mjs";
import Erratum from "./erratum.mjs";
import Stack from "./stack.mjs";

const VERSION = "1.6.0";

export default (dependencies) => {
  const {
    log: { logDebug },
    "validate-appmap": { validateAppmap },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapFile, compileClassmap } =
    Classmap(dependencies);
  const { manufactureCompletion } = Completion(dependencies);
  const { orderByStack } = Stack(dependencies);
  const { compileEventTrace } = Event(dependencies);
  const { substituteErratum } = Erratum(dependencies);
  return {
    compileTrace: (configuration, files, events, termination) => {
      logDebug(
        "Trace:\n  configuration = %j\n  files = %j\n  events = %j\n  termination = %j",
        configuration,
        files,
        events,
        termination,
      );
      const classmap = createClassmap(configuration);
      for (const file of files) {
        addClassmapFile(classmap, file);
      }
      events = substituteErratum(events);
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
