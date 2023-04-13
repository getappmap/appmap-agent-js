import { URL } from "../../url/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";

const { String, parseInt } = globalThis;

export const partialx_ = (f, x1) => (x2) => f(x1, x2);
export const partialx__ = (f, x1) => (x2, x3) => f(x1, x2, x3);
export const partialxx_ = (f, x1, x2) => (x3) => f(x1, x2, x3);
export const partialxx__ = (f, x1, x2) => (x3, x4) => f(x1, x2, x3, x4);
export const partialx___ = (f, x1) => (x2, x3, x4) => f(x1, x2, x3, x4);
export const partialxx___ = (f, x1, x2) => (x3, x4, x5) =>
  f(x1, x2, x3, x4, x5);
export const partialxxx___ = (f, x1, x2, x3) => (x4, x5, x6) =>
  f(x1, x2, x3, x4, x5, x6);
export const partialxx____ = (f, x1, x2) => (x3, x4, x5, x6) =>
  f(x1, x2, x3, x4, x5, x6);
export const partialxxx____ = (f, x1, x2, x3) => (x4, x5, x6, x7) =>
  f(x1, x2, x3, x4, x5, x6, x7);

export const resolveHostPath = ({ name, port }, path) =>
  new URL(path, `http://${name}:${String(port)}`).href;

export const parseHost = (host_string) => {
  const { hostname: name, port: port_string } = new URL(
    `http://${host_string}`,
  );
  return {
    name,
    port: port_string === "" ? 80 : parseInt(port_string),
  };
};

export const toPort = (address) => {
  if (typeof address === "string") {
    return address;
  } else if (typeof address === "object" && address !== null) {
    return address.port;
  } else {
    throw new InternalAppmapError("invalid server address");
  }
};

export const toSocketAddress = (address) => {
  if (typeof address === "string") {
    return { path: address };
  } else if (typeof address === "object" && address !== null) {
    return { host: "localhost", port: address.port };
  } else {
    throw new InternalAppmapError("invalid server address");
  }
};
