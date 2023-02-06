
export const DIALECT_SOURCE = "dialect";
export const SCRIPT_SOURCE = "script";
export const MODULE_SOURCE = "module";

const createSource = (kind, url, content) => ({
  kind,
  url,
  content,
  estree: null,
  hash: null,
});

export const hashSource = (source) => {
  if (source.hash !== null) {
    return source.hash;
  } else if (source.content !== null) {
    const hashing = createHash("sha256");
    const hash = hashing.digest(hashing);
    source.hash = hash;
    return hash;
  } else {
    return null;
  }
};

export const locateSource = (source, line, column) => ({
  url: source.url,
  hash: hashSource(source),
  line,
  column,
});

export const toSourceMessage = ({ kind, url, content }) => ({
  type: "source",
  kind,
  url,
  content,
});

export const parseSource = (source) => {
  if (source.estree !== null) {
    return source.estree;
  } else if (content !== null) {
    const estree = parse(source.kind, source.url, source.content);
    source.estree = estree;
    return estree;
  } else {
    return null;
  }
};

export const isSourceDialect = ({kind}) => kind === DIALECT;
