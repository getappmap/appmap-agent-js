export default (dependencies) => {
  return {
    registerSourceProtocol: (file) => ["source", file],
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
