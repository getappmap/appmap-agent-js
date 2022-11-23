import { assertEqual } from "../../__fixture__.mjs";
import { now } from "./index.mjs";

assertEqual(typeof now(), "number");
