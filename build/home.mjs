import { dirname } from "path";
import { fileURLToPath } from "url";

const { url } = import.meta;
const __dirname = dirname(fileURLToPath(url));

export const home = dirname(__dirname);
