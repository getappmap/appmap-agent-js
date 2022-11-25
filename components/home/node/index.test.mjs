import { assertMatch } from "../../__fixture__.mjs";
import { home } from "./index.mjs";

assertMatch(home, /appmap-agent-js\/$/u);
