import { readFile } from "node:fs";
import { Buffer } from "node:buffer";
import {
  logDebugWhen,
  logErrorWhen,
  logWarning,
  logDebug,
} from "../../log/index.mjs";
import { self_directory } from "../../self/index.mjs";
import { URL } from "../../url/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { assert, hasOwnProperty } from "../../util/index.mjs";
import { sendBackend } from "../../backend/index.mjs";
import { partialxx_, resolveHostPath } from "./util.mjs";
import { bufferReadable } from "./stream.mjs";
import { instrumentHtml } from "./html.mjs";
import { instrumentJs } from "./js.mjs";
import {
  forwardRequest,
  forwardResponse,
  forwardUpgrade,
  forwardConnect,
} from "./forward.mjs";

const {
  JSON: { stringify: stringifyJSON, parse: parseJSON },
} = globalThis;

const { from: toBuffer } = Buffer;

// https://www.ietf.org/rfc/rfc9239.html#section-6
// https://www.iana.org/assignments/media-types/media-types.xhtml
const isJavascriptContentType = (header) =>
  header.startsWith("text/javascript") ||
  header.startsWith("text/ecmascript") ||
  header.startsWith("application/javascript") ||
  header.startsWith("application/ecmascript");

const isHtmlContentType = (header) => header.startsWith("text/html");

const getContentTypeCharset = (header) => {
  logDebugWhen(
    !header.toLowerCase().includes("charset=utf-8"),
    "http response content-type header does not declare utf8 encoding but will try to use it anyway, got: %j",
    header,
  );
  return "utf8";
};

export const interceptRequest = (
  configuration,
  backend,
  host,
  inc_req,
  out_res,
) => {
  logDebug(
    "intercept request to %j >> %s %s %j",
    host,
    inc_req.method,
    inc_req.url,
    inc_req.headers,
  );
  assert(
    inc_req.url !== `/${configuration["http-switch"]}`,
    "unexpected regular request related to appmap",
    InternalAppmapError,
  );
  forwardRequest(host, inc_req, (error, inc_res) => {
    /* c8 ignore start */ if (error !== null) {
      logWarning(
        "error on request to %j >> %s %s %j >> %o",
        host,
        inc_req.method,
        inc_req.url,
        inc_req.headers,
        error,
      );
      out_res.writeHead(500);
      out_res.end();
    } /* c8 ignore stop */ else {
      logDebug(
        "intercept response from %j >> %j %s %j",
        host,
        inc_res.statusCode,
        inc_res.statusMessage,
        inc_res.headers,
      );
      if (
        hasOwnProperty(inc_res.headers, "content-type") &&
        isHtmlContentType(inc_res.headers["content-type"])
      ) {
        readFile(
          new URL("dist/bundles/recorder-browser.mjs", self_directory),
          "utf8",
          (error, content) => {
            assert(
              !logErrorWhen(
                error !== null,
                "could not read recorder bundle for browser >> %o",
                error,
              ),
              "could not read recorder bundle for browser",
              InternalAppmapError,
            );
            bufferReadable(inc_res, (buffer) => {
              const encoding = getContentTypeCharset(
                inc_res.headers["content-type"],
              );
              const body = toBuffer(
                instrumentHtml(
                  partialxx_(instrumentJs, configuration, backend),
                  [
                    {
                      type: "script",
                      url: null,
                      content: `
                      "use strict";
                      ((() => {
                        if (globalThis.__APPMAP_CONFIGURATION__ === void 0) {
                          globalThis.__APPMAP_CONFIGURATION__ = ${stringifyJSON(
                            configuration,
                          )};
                          globalThis.__APPMAP_LOG_LEVEL__ = ${stringifyJSON(
                            configuration.log.level,
                          )};
                          ${content}
                        }
                      }) ());
                    `,
                    },
                  ],
                  {
                    url: resolveHostPath(host, inc_req.url),
                    content: buffer.toString(encoding),
                  },
                ),
                encoding,
              );
              out_res.writeHead(inc_res.statusCode, inc_res.statusMessage, {
                ...inc_res.headers,
                "content-length": body.length,
              });
              out_res.end(body);
            });
          },
        );
      } else if (
        hasOwnProperty(inc_res.headers, "content-type") &&
        isJavascriptContentType(inc_res.headers["content-type"])
      ) {
        bufferReadable(inc_res, (buffer) => {
          const encoding = getContentTypeCharset(
            inc_res.headers["content-type"],
          );
          const body = toBuffer(
            instrumentJs(configuration, backend, {
              url: resolveHostPath(host, inc_req.url),
              content: buffer.toString(encoding),
            }),
            encoding,
          );
          out_res.writeHead(inc_res.statusCode, inc_res.statusMessage, {
            ...inc_res.headers,
            "content-length": body.length,
          });
          out_res.end(body);
        });
      } else {
        forwardResponse(inc_res, out_res);
      }
    }
  });
};

export const interceptUpgrade = (
  configuration,
  backend,
  wss,
  host,
  req,
  socket,
  head,
) => {
  logDebug(
    "intercept upgrade to %j >> %s %s %j",
    host,
    req.method,
    req.url,
    req.headers,
  );
  if (req.url === `/${configuration["http-switch"]}`) {
    /* c8 ignore start */
    socket.on("error", (error) => {
      logWarning(
        "appmap socket error %j >> %s %s %j >> %o",
        host,
        req.method,
        req.url,
        req.headers,
        error,
      );
    });
    /* c8 ignore stop */
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.on("message", (data) => {
        sendBackend(backend, parseJSON(data.toString("utf8")));
      });
      /* c8 ignore start */
      ws.on("error", (error) => {
        logWarning(
          "appmap websocket error %j >> %s %s %j >> %o",
          host,
          req.method,
          req.url,
          req.headers,
          error,
        );
      });
    });
    /* c8 ignore stop */
  } else {
    forwardUpgrade(host, req, socket, head);
  }
};

export const interceptConnect = (
  configuration,
  _backend,
  host,
  req,
  socket,
  head,
) => {
  logDebug(
    "intercept connect to %j >> %s %s %j",
    host,
    req.method,
    req.url,
    req.headers,
  );
  assert(
    req.url !== `/${configuration["http-switch"]}`,
    "unexpected connect request related to appmap",
    InternalAppmapError,
  );
  forwardConnect(host, req, socket, head);
};
