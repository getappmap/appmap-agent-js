import { digest } from "../../hash/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert } from "../../util/index.mjs";
import { parseEstree } from "../../parse/index.mjs";
export {
  printComment,
  getLeadingCommentArray,
  extractCommentLabelArray,
} from "../../parse/index.mjs";

export const createSource = (url, content) => ({
  url,
  content,
  estree: null,
  hash: null,
});

export const resetSourceUrl = (source, url) =>
  createSource(url, source.content);

export const isSourceEmpty = ({ content }) => content === null;

export const getSourceUrl = ({ url }) => url;

export const getSourceContent = ({ content }) => {
  assert(
    content !== null,
    "getSourceContent called on empty source",
    InternalAppmapError,
  );
  return content;
};

export const hashSource = (source) => {
  if (source.hash !== null) {
    return source.hash;
  } else {
    assert(
      source.content !== null,
      "hashSource called on empty source",
      InternalAppmapError,
    );
    const hash = digest(source.content);
    source.hash = hash;
    return hash;
  }
};

export const parseSource = (source) => {
  if (source.estree !== null) {
    return source.estree;
  } else {
    assert(
      source.content !== null,
      "parseSource called on empty source",
      InternalAppmapError,
    );
    const estree = parseEstree({ url: source.url, content: source.content });
    source.estree = estree;
    return estree;
  }
};

// helper //

export const makeSourceLocation = (source, line, column) => ({
  url: source.url,
  hash: isSourceEmpty(source) ? null : hashSource(source),
  line,
  column,
});

export const fromSourceMessage = (message) => {
  assert(
    message.type === "source",
    "expected source message to create source",
    InternalAppmapError,
  );
  return createSource(message.url, message.content);
};

export const toSourceMessage = (source) => ({
  type: "source",
  url: getSourceUrl(source),
  content: isSourceEmpty(source) ? null : getSourceContent(source),
});
