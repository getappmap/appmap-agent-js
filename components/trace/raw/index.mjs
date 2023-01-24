import { toAbsoluteUrl } from "../../url/index.mjs";

export const compileTrace = (
  { recorder, appmap_dir, appmap_file },
  messages,
) => ({
  url: toAbsoluteUrl(`${recorder}/${appmap_file}.appmap.json`, appmap_dir),
  content: messages,
});
