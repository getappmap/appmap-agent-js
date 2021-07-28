
export default (dependencies) => {
  const {
    frontend: {
      createFrontend,
      initializeFrontend,
      terminateFrontend,
      runAsync,
      transformSource,
      createTrack,
      controlTrack,
    },
  } = dependencies;
  return {
    main: (process) => {
      const {env, argv} = process;
      const config = createConfig({env, argv});
      const {enabled} = config;
      for (const [specifier, boolean] of enabled) {
        if (matchSpecifier(specifier, process.argv) {
          const frontend = createFrontend(config);
          initializeFrontend(frontend);
          const track = createTrack(frontend);
          controlTrack(frontend, track, "start");
          process.on("exit", (code, signal) => {
            controlTrack(frontend, track, "stop");
            terminateFrontend(frontend, { type: "exit", code, signal });
          });
          runAsync(frontend).then((error) => { throw error });
          return null;
        }
      }
      return false;
    },
  };


    };
  };
};

// appmap.start({
//   cwd: process.cwd(),
//   "class-map-pruning": false,
//   "event-pruning": false,
//   recorder: "normal",
//   base: ".",
// });
