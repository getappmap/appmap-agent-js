const _encodeURIComponent = encodeURIComponent;

export default (dependencies) => {
  const {
    util: { generateDeadcode, assert, identity, constant },
  } = dependencies;
  // Include all url characters but: '%', '/', '?', and '#'
  const regexp = /^([A-Za-z0-9\-_.~!$&'()*+,:;=@[\]]|(%[A-Fa-f0-9]{2}))*$/u;
  return {
    getShell: generateDeadcode(
      "platform.getShell should not be called on browser",
    ),
    makeSegment: _encodeURIComponent,
    encodeSegment: (segment) => {
      assert(regexp.test(segment), "invalid uri path segment");
      return segment;
    },
    decodeSegment: identity,
    joinPath: (segments) => `/${segments.join("/")}`,
    splitPath: (path) => {
      assert(
        path[0] === "/",
        "browser path should always starts with a forward slash",
      );
      const segments = path.split("/");
      segments.shift();
      return segments;
    },
    isAbsolutePath: constant(false),
  };
};
