import { assertEqual } from "../../__fixture__.mjs";
import Engine from "./index.mjs";
const { getEngine } = Engine({});
const { name } = getEngine();
assertEqual(name, "node");
