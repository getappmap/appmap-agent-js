const global_Error = Error;

module.exports = (host, port, onError) => {
  throw new global_Error("http3 is not yet supported");
};
