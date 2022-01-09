import { sep as path_separator } from "path";

await import(
  `../../${process.env.TURTLE_TEST.split(path_separator).join("/")}`
);
