#!/usr/bin/env node

export {transformSource} from "./process.mjs";

import {generateMainAsync} from "./process.mjs";

const mainAsync = await generateMainAsync({client:"node-tcp"});

mainAsync(process);
