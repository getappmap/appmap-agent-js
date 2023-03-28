import { tmpdir } from "node:os";
import { join as joinPath } from "node:path";
import { getUuid } from "../../uuid/random/index.mjs";
import { InternalAppmapError } from "../../error/index.mjs";
import { hasOwnProperty } from "../../util/index.mjs";
import {
  toIpcPath,
  fromIpcPath,
  convertFileUrlToPath,
  convertPathToFileUrl,
} from "../../path/index.mjs";

export const convertPort = (port) => {
  if (typeof port === "string") {
    if (port === "") {
      return toIpcPath(joinPath(tmpdir(), getUuid()));
    } else {
      return toIpcPath(convertFileUrlToPath(port));
    }
  } else if (typeof port === "number") {
    return port;
  } else {
    throw new InternalAppmapError("invalid port");
  }
};

export const revertPort = (address) => {
  if (typeof address === "string") {
    return convertPathToFileUrl(fromIpcPath(address));
  } else if (
    typeof address === "object" &&
    hasOwnProperty(address, "port") &&
    typeof address.port === "number"
  ) {
    return address.port;
  } else {
    throw new InternalAppmapError("invalid address");
  }
};
