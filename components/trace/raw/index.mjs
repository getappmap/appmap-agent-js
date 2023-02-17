import { toSourceMessage } from "../../source/index.mjs";
import { toAbsoluteUrl } from "../../url/index.mjs";

export const compileTrace = (configuration, sources, messages, termination) => {
  const { recorder, appmap_file, appmap_dir } = configuration;
  return {
    url: toAbsoluteUrl(`${recorder}/${appmap_file}.appmap.json`, appmap_dir),
    content: {
      configuration,
      messages: [...sources.map(toSourceMessage), ...messages],
      termination,
    },
  };
};
