import { assertEqual } from "../../__fixture__.mjs";

import { version } from "./index.mjs?env=test";

assertEqual(typeof version, "string");
