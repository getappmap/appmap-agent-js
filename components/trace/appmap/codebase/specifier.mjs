import { InternalAppmapError } from "../../../error/index.mjs";
import { assert } from "../../../util/index.mjs";
import { toRelativeUrl, URL } from "../../../url/index.mjs";

const setUrlHash = (url, hash) => {
  const url_obj = new URL(url);
  url_obj.hash = hash;
  return url_obj.toString();
};

const toSpecifier = (url, base) => {
  const relative = toRelativeUrl(url, base);
  if (relative === null) {
    return url;
  } else if (relative.startsWith("./") || relative.startsWith("../")) {
    return relative;
  } else {
    return `./${relative}`;
  }
};

export const toDynamicSpecifier = (url, base, version) =>
  toSpecifier(setUrlHash(url, `#${version}`), base);

export const toStaticSpecifier = (url, base) =>
  toSpecifier(setUrlHash(url, ""), base);

export const splitSpecifier = (specifier) => {
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return specifier.split("/");
  } else if (/^[a-zA-Z]+:\/\//u.test(specifier)) {
    const { protocol, host, pathname, search, hash } = new URL(specifier);
    assert(
      pathname.startsWith("/"),
      "url pathname should start with a slash",
      InternalAppmapError,
    );
    const dirnames = pathname.substring(1).split("/");
    const filename = `${dirnames.pop()}${search}${hash}`;
    return [`${protocol}//${host}`, ...dirnames, filename];
  } else {
    throw new InternalAppmapError("invalid specifier");
  }
};

export const splitSpecifierDirectory = (specifier) => {
  const segments = splitSpecifier(specifier);
  segments.pop();
  if (segments[0] === "." && segments.length > 1) {
    segments.shift();
  }
  return segments;
};
