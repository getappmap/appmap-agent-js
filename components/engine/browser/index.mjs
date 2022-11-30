import { ExternalAppmapError } from "../../error/index.mjs";
import { logErrorWhen } from "../../log/index.mjs";
import { assert } from "../../util/index.mjs";

const {
  navigator: { userAgent: description },
} = globalThis;

const regexp = /^([^ \n\t/]+)\/([^ \n\t/]+) /u;

export const getEngine = () => {
  const parts = regexp.exec(description);
  assert(
    !logErrorWhen(
      parts === null,
      "Could not parse navigator.userAgent: %j",
      description,
    ),
    "Could not parse userAgent",
    ExternalAppmapError,
  );
  return `${parts[1]}@${parts[2]}`;
};
