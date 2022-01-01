const _decodeURIComponent = decodeURIComponent;
const _URL = URL;

export default (dependencies) => {
  const {
    path: { encodeSegment, decodeSegment, splitPath, isAbsolutePath },
  } = dependencies;

  const isNotEmptyString = (any) => any !== "";

  const getLastURLSegment = (url) => {
    const { pathname } = new _URL(url);
    const encoded_segments = pathname.split("/");
    return decodeSegment(encoded_segments[encoded_segments.length - 1]);
  };

  // TODO: investigate whether is it worth detecting going to far into the
  // hiearchy of UNC paths. Normally the last two segments should remain
  // intact as ":C" file urls:
  // new URL("file:///C:/foo/../../").toString() >> 'file:///C:/'
  // new URL("file:////host/label/foo/../../").toString() >> 'file:////host/'
  const appendURLPathname = (url, pathname) => {
    const url_object = new _URL(url);
    url_object.pathname += `${
      url_object.pathname.endsWith("/") ? "" : "/"
    }${pathname}`;
    return url_object.toString();
  };

  const setURLPathname = (url, pathname) => {
    const url_object = new _URL(url);
    url_object.pathname = pathname;
    return url_object.toString();
  };

  const appendURLSegment = (url, segment) =>
    appendURLPathname(url, encodeSegment(segment));

  const appendURLSegmentArray = (url, segments) =>
    appendURLPathname(url, segments.map(encodeSegment).join("/"));

  const getWindowsDrive = (pathname) =>
    /^\/[a-zA-Z]:/u.test(pathname) ? pathname[1] : null;

  const getUNCAddress = (pathname) => {
    const parts = /^(\/\/[^/]+\/[^/]+\/)/u.exec(pathname);
    return parts === null ? null : parts[1];
  };

  const urlifyPath = (path, base_url) => {
    const segments = splitPath(path);
    if (isAbsolutePath(path)) {
      if (segments[0].length === 2 && segments[0][1] === ":") {
        const root = segments.shift();
        return setURLPathname(
          base_url,
          [root, ...segments.map(encodeSegment)].join("/"),
        );
      } else {
        return setURLPathname(base_url, segments.map(encodeSegment).join("/"));
      }
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

  const pathifyURL = (url, base_url) => {
    const { pathname, protocol, host } = new _URL(url);
    const {
      pathname: base_pathname,
      protocol: base_protocol,
      host: base_host,
    } = new _URL(base_url);
    if (
      protocol !== base_protocol ||
      host !== base_host ||
      (protocol === "file:" &&
        (getWindowsDrive(pathname) !== getWindowsDrive(base_pathname) ||
          getUNCAddress(pathname) !== getUNCAddress(base_pathname)))
    ) {
      return null;
    } else {
      const segments = decodePathname(pathname);
      const base_segments = decodePathname(base_pathname);
      while (
        segments.length > 0 &&
        base_segments.length > 0 &&
        _decodeURIComponent(segments[0]) ===
          _decodeURIComponent(base_segments[0])
      ) {
        segments.shift();
        base_segments.shift();
      }
      while (base_segments.length > 0) {
        base_segments.pop();
        segments.unshift("..");
      }
      if (segments.length === 0) {
        segments.push(".");
      }
      return segments.join("/");
    }
  };

  return {
    pathifyURL,
    urlifyPath,
    appendURLSegment,
    appendURLSegmentArray,
    getLastURLSegment,
  };
};
