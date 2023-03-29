import * as HtmlParser2 from "htmlparser2";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { URL } from "../../url/index.mjs";
import { logWarning } from "../../log/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const {
  String,
  Reflect: { ownKeys },
  JSON: { stringify: stringifyJSON },
} = globalThis;

const { Parser: HtmlParser } = HtmlParser2;

const escape_sequence_mapping = {
  __proto__: null,
  "&": "&amp",
  "<": "&lt",
  ">": "&gt",
  '"': "&quot",
};

const escapeSpecialCharacter = (character) => {
  assert(
    hasOwnProperty(escape_sequence_mapping, character),
    "unexpected special character",
    InternalAppmapError,
  );
  return escape_sequence_mapping[character];
};

const escapeHtml = (string) =>
  string.replace(/[&<>"]/gu, escapeSpecialCharacter);

const escapeScriptTag = () => "<\\/script>";

const escapeJs = (string) => string.replace(/<\/script>/gu, escapeScriptTag);

const makeHashUrl = (url, { start, end }) => {
  const url_object = new URL(url);
  url_object.hash = `#${String(start)}-${String(end)}`;
  return url_object.href;
};

const extractScriptType = (attributes) =>
  hasOwnProperty(attributes, "type") ? attributes.type : "script";

const isInstrumentable = ({ external, type }) =>
  !external && (type === "script" || type === "module");

// It would be easier to consistently
// set the `type` attribute but jsdom
// does support it and ignore the
// entire script when `type` is present.
const toTypeAttribute = (type) => {
  if (type === "script") {
    return "";
  } else if (type === "module") {
    return ' type="module"';
  } /* c8 ignore start */ else {
    throw InternalAppmapError("invalid script type");
  } /* c8 ignore stop */
};

export const instrumentHtml = (instrumentJs, prelude, { url, content }) => {
  const tokens = [];
  let has_head = false;
  let script = null;
  const parser = new HtmlParser({
    onopentag: (name, attributes) => {
      tokens.push(`<${escapeHtml(name)}`);
      for (const key of ownKeys(attributes)) {
        tokens.push(` ${escapeHtml(key)}="${escapeHtml(attributes[key])}"`);
      }
      tokens.push(">");
      if (name === "head") {
        if (has_head) {
          logWarning("Duplicate head tag in %j", url);
        } else {
          has_head = true;
          for (const { type, url, content } of prelude) {
            if (content === null) {
              assert(
                url !== null,
                "prelude file should either define a url or a content",
                InternalAppmapError,
              );
              tokens.push(
                `<script${toTypeAttribute(type)} src=${stringifyJSON(
                  url,
                )}></script>`,
              );
            } else {
              tokens.push(
                `<script${toTypeAttribute(type)}>${escapeJs(content)}</script>`,
              );
            }
          }
        }
      } else if (name === "script") {
        assert(
          script === null,
          "nested script tag in html",
          InternalAppmapError,
        );
        if (has_head) {
          script = {
            type: extractScriptType(attributes),
            external: hasOwnProperty(attributes, "src"),
            start: parser.startIndex,
            tokens: [],
            end: null,
          };
        } else {
          logWarning(
            "Not instrumenting script in %j because it appears before any head html tag",
            url,
          );
        }
      }
    },
    onprocessinginstruction: (_name, text) => {
      tokens.push(`<${escapeHtml(text)}>`);
    },
    oncomment: (comment) => {
      tokens.push(`<!--${escapeHtml(comment)}-->`);
    },
    ontext: (text) => {
      if (script === null) {
        tokens.push(escapeHtml(text));
      } else {
        script.tokens.push(text);
      }
    },
    onclosetag: (name) => {
      if (script !== null) {
        assert(
          name === "script",
          "expected script closing tag",
          InternalAppmapError,
        );
        script.end = parser.endIndex;
        tokens.push(
          isInstrumentable(script)
            ? escapeJs(
                instrumentJs({
                  type: script.type,
                  url: makeHashUrl(url, script),
                  content: script.tokens.join(""),
                }),
              )
            : // We do not need to escape the script content
              // because it is impossible for it to contain
              // `</script>` as it would have terminated
              // the tag.
              script.tokens.join(""),
        );
        script = null;
      }
      tokens.push(`</${escapeHtml(name)}>`);
    },
  });
  parser.end(content);
  assert(
    script === null,
    "unfinished script tag should have been completed by htmlparser2",
    InternalAppmapError,
  );
  return tokens.join("");
};
