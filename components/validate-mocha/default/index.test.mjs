import "../../__fixture__.mjs";
import { validateMocha } from "./index.mjs?env=test";

validateMocha({ prototype: { version: "8.1.2" } });
