const { process } = globalThis;

import { mainAsync } from "../../components/setup/index.mjs?env=node";

export default mainAsync(process);
