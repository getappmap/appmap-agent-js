export {transformSource} from "./process.mjs";

import {generateMainAsync} from "./process.mjs";

const mainAsync = await generateMainAsync({client:"inline"});

mainAsync(process);
