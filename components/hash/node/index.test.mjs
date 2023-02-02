import { assertEqual, assertNotEqual } from "../../__fixture__.mjs";
import { hashFile } from "./index.mjs";

const file = { url: "protocol://host/path", content: "content" };

assertEqual(typeof hashFile(file), "string");

assertEqual(hashFile(file), hashFile(file));

assertNotEqual(hashFile(file), hashFile({ ...file, content: "CONTENT" }));
