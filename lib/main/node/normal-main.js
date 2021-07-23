
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
    mainAsync: (process) => {
      const {env, argv} = process;
      const config = createConfig({env, argv});
      const frontend = createFrontend(config);
      initializeFrontend(frontend);
      const track = createTrack(frontend);
      controlTrack(frontend, track, "start");
      process.on("exit", (code, signal) => {
        controlTrack(frontend, track, "stop");
        terminateFrontend(frontend, { type: "exit", code, signal });
      });
      return runAsync(frontend);
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
