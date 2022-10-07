import "../../__fixture__.mjs";
import { logInfo } from "./index.mjs?env=test";

logInfo("foo %s", "bar");
