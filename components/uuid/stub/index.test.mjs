import { assertEqual } from "../../__fixture__.mjs";
import UUID from "./index.mjs";

const { getUUID } = UUID({});
assertEqual(getUUID(), "uuid");
