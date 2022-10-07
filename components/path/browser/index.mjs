const { URL, encodeURIComponent } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { generateDeadcode, assert, identity, constant } = await import(
  `../../util/index.mjs${__search}`
);

// Include all url characters but: '%', '/', '?', and '#'
const regexp = /^([A-Za-z0-9\-_.~!$&'()*+,:;=@[\]]|(%[A-Fa-f0-9]{2}))*$/u;

export const getShell = generateDeadcode(
  "platform.getShell should not be called on browser",
);

export const toIPCPath = identity;

export const fromIPCPath = identity;

export const makeSegment = encodeURIComponent;

export const encodeSegment = (segment) => {
  assert(regexp.test(segment), "invalid uri path segment");
  return segment;
};

export const decodeSegment = identity;

export const joinPath = (segments) => `/${segments.join("/")}`;

export const splitPath = (path) => {
  assert(
    path[0] === "/",
    "browser path should always starts with a forward slash",
  );
  const segments = path.split("/");
  segments.shift();
  return segments;
};

export const isAbsolutePath = constant(false);
