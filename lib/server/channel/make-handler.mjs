
import logger from "./logger.mjs";

const isPresent = (name, json, key) => {
  if (Reflect.getOwnPropertyDescriptor(json, key) === undefined) {
    logger.error("Missing %s field in %s message", key, name);
    return false;
  }
  return true;
};

const makeIsTypeof = (type) => (name, json, key) => {
  if (!isPresent(name, json, key)) {
    return false;
  }
  if (typeof json[key] !== type) {
    logger.error("Invalid %s field in %s message, expected a %s and got %j", key, name, type, json[key]);
    return false;
  }
  return true;
};

const isTypeofString = makeIsTypeof("string");

const makeIsKey = (object) => (name, json, key) => {
  if (!isString(name, json, key)) {
    return false;
  }
  if (!(json[key] in object)) {
    logger.error("Unrecognized %s field in %s message; got: %j", key, name, json[key]);
    return false;
  }
  return true;
};

const makeIsAny = (array) => (name, json, key) => {
  if (!isPresent(name, json, key)) {
    return false;
  }
  if (!array.includes(json[key])) {
    logger.error("Invalid enumeration-based %s field in %s message; expected one of %j, and got: %j", key, name, array, json[key]);
    return false;
  }
  return true;
};

const isAnySource = makeIsAny(["script", "module"]);

export const makeHandler = (config) => {
  const appmaps = {__proto__:null};
  const isKeyAppmaps = makeIsKey(appmaps);
  return (data) => {
    if (!isPresent(data, "name")) {
      return null;
    }
    if (data.name === "initialize") {
      if (!isPresent(data, "init")) {
        return null;
      };
      let session
      do {
        session = Math.random().toString(36).substring(2)
      } while (session in appmaps);
      const appmap = new Appmap(recorder, config, data.init);
      appmaps[session] = appmap;
      return {
        session,
        prefix: appmap.getEscapePrefix()
      };
    }
    if (data.name === "terminate") {
      if (!isKeyAppmaps("terminate", data, "session")) {
        return false;
      }
      if (isPresent("terminate", data, "reason")) {
        appmaps[data.session].terminate(data.reason);
      } else {
        appmaps[data.session].terminate(null);
      }
      delete appmaps[data.session].terminate();
      return true;
    }
    if (data.name === "instrument") {
      if (
        !isTypeofString("instrument", data, "content") ||
        !isKeyAppmaps("instrument", data, "session") ||
        !isAnySource("instrument", data, "source") ||
        !isTypeofString("instrument", data, "path")
      ) {
        return null;
      }
      return appmaps[data.session].instrument(data.source, data.path, data.content);
    }
    if (data.name === "emit") {
      if (
        !isKeyAppmaps("instrument", data, "session") ||
        !isPresent("instrument", data, "event")
      ) {
        return false;
      }
      appmaps[data.session].emit(data.event);
      return true;
    }
    return null;
  };
};
