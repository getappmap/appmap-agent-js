import { assertEqual } from "../../__fixture__.mjs";
import { hashSourceMessage } from "./hash.mjs";

const message = {
  type: "source",
  url: "protocol://host/path",
  content: "content",
};

assertEqual(hashSourceMessage(message), hashSourceMessage(message));
