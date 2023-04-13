import {
  createSource as createSourceInner,
  resolveClosurePosition,
  applyExclusionCriteria,
} from "../../source/index.mjs";
import { parseEstree } from "../../parse/index.mjs";
import { lookupUrl } from "../../matcher/index.mjs";
import { digest } from "../../hash/index.mjs";

export const createSource = (
  { url, content },
  {
    packages: package_matcher_array,
    exclude: global_criteria,
    "default-package": default_package,
    "postmortem-function-exclusion": postmortem,
  },
) => {
  const { enabled, exclude: local_criteria } = lookupUrl(
    package_matcher_array,
    url,
    default_package,
  );
  if (enabled) {
    return {
      postmortem,
      enabled: true,
      criteria: [...local_criteria, ...global_criteria],
      url,
      content,
      hash: null,
      program: null,
      inner: null,
    };
  } else {
    return {
      postmortem,
      enabled: false,
      criteria: [],
      url,
      content,
      hash: null,
      program: null,
      inner: null,
    };
  }
};

/////////////////////////
// Lazy Initialization //
/////////////////////////

export const parseSource = (source) => {
  if (source.program === null) {
    const { url, content } = source;
    const program = parseEstree({ url, content });
    source.program = program;
    return program;
  } else {
    return source.program;
  }
};

export const digestSourceContent = (source) => {
  const { content } = source;
  if (source.hash === null && content !== null) {
    const hash = digest(content);
    source.hash = hash;
    return hash;
  } else {
    return source.hash;
  }
};

export const toInnerSource = (source) => {
  if (source.inner === null) {
    const { url, content, criteria } = source;
    const program = parseSource(source);
    const inner = createSourceInner({ url, content, program });
    applyExclusionCriteria(inner, criteria);
    source.inner = inner;
    return inner;
  } else {
    return source.inner;
  }
};

///////////
// Query //
///////////

export const isSourceEnabled = ({ enabled }) => enabled;

export const getSourceFile = ({ url, content }) => ({ url, content });

export const isSourceContentRequired = ({ enabled, postmortem }) =>
  enabled && postmortem === false;

export const isSourcePostmortemExclusion = ({
  postmortem,
  content,
  program,
}) => {
  if (content === null) {
    return true;
  } else if (typeof postmortem === "boolean") {
    return postmortem;
  } else {
    // If the program is already parsed,
    // it reduces of excluding functions here.
    return program === null;
  }
};

export const resolveClosureLocation = (source, position) => {
  const { enabled, url } = source;
  if (enabled) {
    if (isSourcePostmortemExclusion(source)) {
      return {
        url,
        hash: digestSourceContent(source),
        position,
      };
    } else {
      const maybe_position = resolveClosurePosition(
        toInnerSource(source),
        position,
      );
      return maybe_position === null
        ? null
        : {
            url,
            hash: digestSourceContent(source),
            position: maybe_position,
          };
    }
  } else {
    return null;
  }
};
