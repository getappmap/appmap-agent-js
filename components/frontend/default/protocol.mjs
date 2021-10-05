export default (dependencies) => {
  return {
    registerFileProtocol: (file) => ["file", file],
    startTrackProtocol: (key, initialization) => ["start", key, initialization],
    stopTrackProtocol: (key, termination) => ["stop", key, termination],
    recordEventProtocol: (type, index, time, data_type, data_rest) => [
      "event",
      type,
      index,
      time,
      data_type,
      data_rest,
    ],
  };
};
