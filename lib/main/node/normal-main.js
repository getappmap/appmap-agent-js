
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
      const options = extractOption(process);
      const frontend = createFrontend(makeOptions);
      initializeFrontend(frontend);
      const track = createTrack(frontend, options);
      controlTrack(frontend, track, "start");
      process.on("exit", (code, signal) => {
        terminateFrontend(frontend, { type: "exit", code, signal });
      });
      runAsync(frontend);
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
