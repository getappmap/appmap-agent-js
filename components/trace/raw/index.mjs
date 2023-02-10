import { toAbsoluteUrl } from "../../url/index.mjs";

export const compileTrace = (configuration, messages) => {
  const { recorder, appmap_file, appmap_dir } = configuration;
  return {
    url: toAbsoluteUrl(`${recorder}/${appmap_file}.appmap.json`, appmap_dir),
    content: {
      configuration,
      messages,
    },
  };
};
