import { URL } from "../../url-inner/index.mjs";
export * from "../../url-inner/index.mjs";

const { decodeURIComponent, encodeURIComponent } = globalThis;

const getDrive = (protocol, pathname) =>
  protocol.toLowerCase() === "file:"
    ? /^\/[a-zA-Z]:\//u.test(pathname)
      ? pathname[1].toLowerCase()
      : null
    : null;

const normalizeCase = (pathname, drive) =>
  drive === null ? pathname : pathname.toLowerCase();

export const toAbsoluteUrl = (relative, base_url) =>
  new URL(
    /^[a-zA-Z]:\/[^/]/u.test(relative) ? `/${relative}` : relative,
    base_url,
  ).href;

export const toRelativeUrl = (
  url,
  base_url,
  encodeSegment = encodeURIComponent,
) => {
  const { protocol, host, pathname, search, hash } = new URL(url);
  const {
    protocol: base_protocol,
    host: base_host,
    pathname: base_pathname,
  } = new URL(base_url);
  if (
    protocol.toLowerCase() !== base_protocol.toLowerCase() ||
    host.toLowerCase() !== base_host.toLowerCase()
  ) {
    return null;
  } else {
    const drive = getDrive(protocol, pathname);
    const base_drive = getDrive(base_protocol, base_pathname);
    if (drive !== base_drive) {
      return null;
    } else {
      const segments = normalizeCase(pathname, drive)
        .split("/")
        .map(decodeURIComponent);
      const base_segments = normalizeCase(base_pathname, base_drive)
        .split("/")
        .map(decodeURIComponent);
      base_segments.pop();
      while (
        segments.length > 0 &&
        base_segments.length > 0 &&
        segments[0] === base_segments[0]
      ) {
        segments.shift();
        base_segments.shift();
      }
      while (base_segments.length > 0) {
        base_segments.pop();
        segments.unshift("..");
      }
      if (segments.length > 0 && segments[0] !== "") {
        return `${segments.map(encodeSegment).join("/")}${search}${hash}`;
      } else {
        return `.${search}${hash}`;
      }
    }
  }
};

export const toDirectoryUrl = (url) => {
  const url_obj = new URL(url);
  if (url_obj.pathname.endsWith("/")) {
    return url;
  } else {
    url_obj.pathname += "/";
    return url_obj.href;
  }
};

// Alternatively:
//   url.match(/:\/{0,2}.*\/([^/#]+)(#.*)?$/)[1]
export const getUrlFilename = (url) => {
  const { pathname } = new URL(url);
  if (pathname === "" || pathname.endsWith("/")) {
    return null;
  } else {
    return pathname.substring(pathname.lastIndexOf("/") + 1);
  }
};

// Alternatively:
//   url.match(/([^.\/]+)(\.[^/#]*)(#.*)?$/)[1]
export const getUrlBasename = (url) => {
  const filename = getUrlFilename(url);
  if (filename === null) {
    return null;
  } else if (filename.includes(".")) {
    return filename.substring(0, filename.indexOf("."));
  } else {
    return filename;
  }
};

// Alternatively:
//   url.match(/([^.\/]+)(\.[^/#]*)(#.*)?$/)[2]
export const getUrlExtension = (url) => {
  const filename = getUrlFilename(url);
  if (filename === null) {
    return null;
  } else if (filename.includes(".")) {
    return filename.substring(filename.indexOf("."));
  } else {
    return null;
  }
};

// Alternatively:
//   url.match(/([^\/]+)(\.[^/#]*)(#.*)?$/)[2]
export const getLastUrlExtension = (url) => {
  const filename = getUrlFilename(url);
  if (filename === null) {
    return null;
  } else if (filename.includes(".")) {
    return filename.substring(filename.lastIndexOf("."));
  } else {
    return null;
  }
};
