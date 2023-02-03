import {
  toAbsoluteUrl,
  getUrlBasename,
  getUrlExtension,
} from "../../url/index.mjs";
import { logDebug, logError } from "../../log/index.mjs";
import { validateMessage } from "../../validate/index.mjs";
import {
  createSession,
  sendSession,
  hasSessionTrack,
  compileSessionTrack,
  compileSessionTrackArray,
} from "./session.mjs";

const { String, Set, Map } = globalThis;

export const createBackend = (configuration) => ({
  configuration,
  urls: new Set(),
  sessions: new Map(),
});

const refreshUrl = (urls, url) => {
  const basename = getUrlBasename(url);
  const extension = getUrlExtension(url);
  let index = 0;
  while (urls.has(url)) {
    index += 1;
    url = toAbsoluteUrl(`${basename}-${String(index)}${extension}`, url);
  }
  urls.add(url);
  return url;
};

const refreshTrace = (urls, { url, content }) => ({
  url: refreshUrl(urls, url),
  content,
});

export const compileBackendTrackArray = ({ sessions, urls }, key) => {
  if (sessions.has(key)) {
    return compileSessionTrackArray(sessions.get(key)).map((trace) =>
      refreshTrace(urls, trace),
    );
  } else {
    return null;
  }
};

export const compileBackendTrack = ({ sessions, urls }, key1, key2) => {
  if (sessions.has(key1)) {
    const maybe_trace = compileSessionTrack(sessions.get(key1), key2);
    if (maybe_trace === null) {
      return null;
    } else {
      return refreshTrace(urls, maybe_trace);
    }
  } else {
    return null;
  }
};

export const hasBackendTrack = ({ sessions }, key1, key2) => {
  if (sessions.has(key1)) {
    return hasSessionTrack(sessions.get(key1), key2);
  } else {
    return null;
  }
};

export const sendBackend = ({ sessions, configuration }, key, message) => {
  logDebug("message >> %j", message);
  if (configuration.validate.message) {
    validateMessage(message);
  }
  if (message.type === "open") {
    if (sessions.has(key)) {
      logError("Existing backend session %j on %j", key, message);
      return false;
    } else {
      sessions.set(key, createSession());
      return true;
    }
  } else {
    if (sessions.has(key)) {
      if (message.type === "close") {
        sessions.delete(key);
        return true;
      } else {
        return sendSession(sessions.get(key), message);
      }
    } else {
      logError("Missing backend session %j on %j", key, message);
      return false;
    }
  }
};
