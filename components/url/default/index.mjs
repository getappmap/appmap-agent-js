const { decodeURIComponent, URL } = globalThis;

const { search: __search } = new URL(import.meta.url);

const { encodeSegment, decodeSegment, splitPath, isAbsolutePath } =
  await import(`../../path/index.mjs${__search}`);
const { expect } = await import(`../../expect/index.mjs${__search}`);

const isNotEmptyString = (any) => any !== "";

export const getLastURLSegment = (url) => {
  const { pathname } = new URL(url);
  const encoded_segments = pathname.split("/");
  return decodeSegment(encoded_segments[encoded_segments.length - 1]);
};

const appendURLPathname = (url, pathname) => {
  const url_object = new URL(url);
  url_object.pathname += `${
    url_object.pathname.endsWith("/") ? "" : "/"
  }${pathname}`;
  return url_object.toString();
};

const setURLPathname = (url, pathname) => {
  const url_object = new URL(url);
  url_object.pathname = pathname;
  return url_object.toString();
};

export const removeLastURLSegment = (url) => {
  const url_object = new URL(url);
  const segments = url_object.pathname.split("/");
  segments.pop();
  url_object.pathname = segments.join("/");
  return url_object.toString();
};

export const appendURLSegment = (url, segment) =>
  appendURLPathname(url, encodeSegment(segment));

export const appendURLSegmentArray = (url, segments) =>
  appendURLPathname(url, segments.map(encodeSegment).join("/"));

const getWindowsDrive = (pathname) =>
  /^\/[a-zA-Z]:/u.test(pathname) ? pathname[1] : null;

// TODO: investigate whether is it worth detecting going to far into the
// hiearchy of UNC paths. Normally the last two segments should remain
// intact as ":C" file urls:
// new URL("file:///C:/foo/../../").toString() >> 'file:///C:/'
// new URL("file:////host/label/foo/../../").toString() >> 'file:////host/'
//
// Lets drop support for UNC file urls.
// In node@14 file:////foo//bar is resolved as file:///foo//bar
// So it seems that leading slashes are collpased on file urls.
// This is not the case in node@16.
//
// const getUNCAddress = (pathname) => {
//   const parts = /^(\/\/[^/]+\/[^/]+\/)/u.exec(pathname);
//   return parts === null ? null : parts[1];
// };
// getUNCAddress(pathname) !== getUNCAddress(base_pathname)))

export const urlifyPath = (path, base_url) => {
  expect(
    !base_url.startsWith("data:"),
    "cannot transform path %j to a url based on data url %j",
    path,
    base_url,
  );
  const segments = splitPath(path);
  if (isAbsolutePath(path)) {
    /* c8 ignore start */
    if (segments[0].length === 2 && segments[0][1] === ":") {
      const root = segments.shift();
      return setURLPathname(
        base_url,
        [root, ...segments.map(encodeSegment)].join("/"),
      );
    } else {
      return setURLPathname(base_url, segments.map(encodeSegment).join("/"));
    }
    /* c8 ignore stop */
  } else {
    return appendURLPathname(base_url, segments.map(encodeSegment).join("/"));
  }
};

const decodePathname = (pathname) => {
  if (getWindowsDrive(pathname) !== null) {
    pathname = pathname.substring(3);
  }
  return pathname.split("/").filter(isNotEmptyString).map(decodeSegment);
};

export const pathifyURL = (url, base_url, dot_prefix = false) => {
  const { pathname, protocol, host } = new URL(url);
  const {
    pathname: base_pathname,
    protocol: base_protocol,
    host: base_host,
  } = new URL(base_url);
  if (
    protocol !== base_protocol ||
    host !== base_host ||
    (protocol === "file:" &&
      getWindowsDrive(pathname) !== getWindowsDrive(base_pathname))
  ) {
    return null;
  } else {
    const segments = decodePathname(pathname);
    const base_segments = decodePathname(base_pathname);
    while (
      segments.length > 0 &&
      base_segments.length > 0 &&
      decodeURIComponent(segments[0]) === decodeURIComponent(base_segments[0])
    ) {
      segments.shift();
      base_segments.shift();
    }
    while (base_segments.length > 0) {
      base_segments.pop();
      segments.unshift("..");
    }
    // This generated paths are sometimes given to node's `--require`.
    // And it relies on having explicit `.` or `..` in relative paths.
    if (segments.length === 0 || (dot_prefix && segments[0] !== "..")) {
      segments.unshift(".");
    }
    return segments.join("/");
  }
};
