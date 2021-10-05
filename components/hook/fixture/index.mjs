import { fileURLToPath } from "url";

export default (dependencies) => {
  const {
    util: { getDirectory },
  } = dependencies;
  const {
    configuration: { createConfiguration, extendConfiguration },
    frontend: { createFrontend },
    emitter: { openEmitter, closeEmitter, sendEmitter, takeLocalEmitterTrace },
  } = dependencies;
  return {
    makeEvent: (type, index, time, data_type, data_rest) => ({
      type,
      index,
      time,
      data: {
        type: data_type,
        ...data_rest,
      },
    }),
    testHookAsync: async (hook, unhook, config, callbackAsync) => {
      const directory = getDirectory(fileURLToPath(import.meta.url));
      const configuration = extendConfiguration(
        createConfiguration(directory),
        { ...config },
        directory,
      );
      const frontend = createFrontend(configuration);
      const emitter = openEmitter(configuration);
      const recovery = hook(emitter, frontend, configuration);
      try {
        sendEmitter(emitter, ["start", "record", { data: {}, path: null }]);
        await callbackAsync(frontend);
        sendEmitter(emitter, ["stop", "record", { status: 0, errors: [] }]);
        const { files, events } = takeLocalEmitterTrace(emitter, "record");
        return { files, events };
      } finally {
        closeEmitter(emitter, { status: 1, errors: [] });
        unhook(recovery);
      }
    },
  };
};
