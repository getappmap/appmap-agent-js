const { process } = globalThis;

import { mainAsync } from "../../components/setup/index.mjs?env=node&log=info";

export default mainAsync(process);
