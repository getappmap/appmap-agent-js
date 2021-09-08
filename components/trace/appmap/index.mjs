import Metadata from "./metadata.mjs";
import Track from "./track.mjs";
import Group from "./group.mjs";
import Classmap from "./classmap.mjs";
import Digest from "./digest.mjs";
import Callstack from "./callstack.mjs";

const VERSION = "1.6.0";

export default (dependencies) => {
  const {
    util: { getBasename, mapMaybe },
    log: { logDebug },
    "validate-appmap": { validateAppmap },
    configuration: { extendConfiguration },
  } = dependencies;
  const { compileMetadata } = Metadata(dependencies);
  const { createClassmap, addClassmapFile, compileClassmap } =
    Classmap(dependencies);
  const { orderByGroup } = Group(dependencies);
  const { collectTracks } = Track(dependencies);
  const { digestTrace } = Digest(dependencies);
  const { frameCallstack } = Callstack(dependencies);
  /* c8 ignore start */
  const getName = ({ name }) => name;
  /* c8 ignore start */
  return {
    compileTrace: (configuration1, marks, termination) => {
      logDebug(
        "Trace:\n  configuration = %j\n  marks = %j\n  termination = %j",
        configuration1,
        marks,
        termination,
      );
      const classmap = createClassmap(configuration1);
      for (const { type, data } of marks) {
        if (type === "file") {
          addClassmapFile(classmap, data);
        }
      }
      const frame = frameCallstack(orderByGroup(marks));
      return collectTracks(marks).map(({ configuration, slice, routes }) => {
        const configuration2 = extendConfiguration(
          configuration1,
          configuration,
          null,
        );
        const {
          output: { filename },
          main,
          name,
          app,
          repository: { package: _package },
        } = configuration2;
        const appmap = {
          version: VERSION,
          metadata: compileMetadata(configuration2, termination),
          classMap: compileClassmap(classmap, routes),
          events: digestTrace(frame, slice, classmap),
        };
        validateAppmap(appmap);
        return {
          name:
            filename ||
            name ||
            mapMaybe(main, getBasename) ||
            app ||
            mapMaybe(_package, getName) ||
            null,
          data: appmap,
        };
      });
    },
  };
};
