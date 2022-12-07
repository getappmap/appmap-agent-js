import { assertEqual } from "../../__fixture__.mjs";
import { version } from "./index.mjs";

assertEqual(typeof version, "string");
