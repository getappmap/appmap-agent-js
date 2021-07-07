
import {expect} from "../../util/index.mjs";

export const checkOptions = (options) => {
  const {host, port} = {
    localhost: "localhost",
    port: null,
    ... options,
  };
  expect(
    (
      typeof port === "number" ||
      (
        typeof port === "string" &&
        (
          host === "localhost" ||
          host === "127.0.0.1"
        )
      )
    ),
    "either port must be a number or it should be a string and host should be the localhost, got %o and %o",
    host,
    port
  );
  return {host, port};
};
