import { sep as path_separator } from "path";

const {
  process: { env },
} = globalThis;

await import(`../../${env.TURTLE_TEST.split(path_separator).join("/")}`);
