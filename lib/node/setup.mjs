const { process } = globalThis;

import "./error.mjs";
import { mainAsync } from "../../components/setup/index.mjs?env=node";

export default mainAsync(process);
