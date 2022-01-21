import Prettier from "prettier";

export const formatFileAsync = async ({ path, content }) => ({
  path,
  content: Prettier.format(content, {
    ...(await Prettier.resolveConfig(path)),
    filepath: path,
  }),
});
