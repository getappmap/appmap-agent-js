
import {FileSystem} from "FileSystem";
import {YAML} from "yaml";

const architecture = YAML.parse();

const map = new Map();

export const createComponentAsync = async (name1, {[name1]:options, ...rest}) => {
  const components = {__proto__:null};
  for (const name2 of architecture[name1][options.type]) {
    components[name2] = await createComponentAsync(name2, rest);
  }
  const module = await import(`components/${name1}/${options.type}/index.mjs`);
  return await module.default(components, options);
};
