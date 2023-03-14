import { square } from "./square";

if (square(3) !== 9) {
  throw new Error("expected 3 * 3 to be 9");
}
