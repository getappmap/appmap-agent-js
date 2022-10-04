import { assertEqual } from "../../__fixture__.mjs";
import { now } from "./index.mjs?env=test";

assertEqual(typeof now(), "number");
