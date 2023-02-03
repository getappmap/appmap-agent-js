import { assertEqual } from "../../__fixture__.mjs";
import { hashSource } from "./hash.mjs";

const file = {
  url: "protocol://host/path",
  content: "content",
};

assertEqual(hashSource(file), hashSource(file));
