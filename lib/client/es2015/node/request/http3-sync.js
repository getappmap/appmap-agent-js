const global_Error = Error;

module.exports = () => {
  throw new global_Error("http3 is not yet supported");
};
