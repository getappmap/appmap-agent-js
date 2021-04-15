const global_Error = Error;

module.exports = (host, port, callback) => {
  throw new global_Error("http3 is not yet supported");
};
