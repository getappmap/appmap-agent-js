import { logError } from "../../log/index.mjs";
import {
  createSession,
  sendSession,
  hasSessionTrack,
  compileSessionTrack,
  compileSessionTrackArray,
  isSessionEmpty,
} from "./session.mjs";

const { Map } = globalThis;

export const createBackend = (configuration) => ({
  configuration,
  sessions: new Map(),
});

export const compileBackendTrackArray = ({ sessions }, key, abrupt) => {
  if (sessions.has(key)) {
    return compileSessionTrackArray(sessions.get(key), abrupt);
  } else {
    return null;
  }
};

export const compileBackendTrack = ({ sessions }, key1, key2, abrupt) => {
  if (sessions.has(key1)) {
    return compileSessionTrack(sessions.get(key1), key2, abrupt);
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

export const isBackendSessionEmpty = ({ sessions }, key) => {
  if (sessions.has(key)) {
    return isSessionEmpty(sessions.get(key));
  } else {
    return null;
  }
};

export const sendBackend = ({ configuration, sessions }, key, message) => {
  if (message.type === "open") {
    if (sessions.has(key)) {
      logError("Existing backend session %j on %j", key, message);
      return false;
    } else {
      sessions.set(key, createSession(configuration));
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
