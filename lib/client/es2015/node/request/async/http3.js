const global_Error = Error;

module.exports = (address) => {
  throw new global_Error("http3 is not yet supported");
};
