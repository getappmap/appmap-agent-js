import { strict as Assert } from "assert";
import UUID from "./index.mjs";

const { equal: assertEqual } = Assert;

const { getUUID } = UUID({});
assertEqual(getUUID(), "uuid");
