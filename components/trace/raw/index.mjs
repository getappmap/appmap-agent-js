import { InternalAppmapError } from "../../error/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

const getConfiguration = (messages) => {
  for (const message of messages) {
    if (message.type === "start") {
      return message.configuration;
    }
  }
  throw new InternalAppmapError("missing start message");
};

export const compileTrace = (messages) => {
  const { recorder, appmap_file, appmap_dir } = getConfiguration(messages);
  return {
    url: toAbsoluteUrl(`${recorder}/${appmap_file}.appmap.json`, appmap_dir),
    content: messages,
  };
};
