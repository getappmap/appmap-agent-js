import { readFile as readFileAsync } from "node:fs/promises";
import { getInstanceSupportUrl } from "./layout.mjs";

const isNotEmptyString = (any) => any !== "";

const parseSupport = (content) =>
  content.replace(/\r/gu, "").split("\n").filter(isNotEmptyString);

export const readInstanceSupportAsync = async (home, component, instance) =>
  parseSupport(
    await readFileAsync(
      getInstanceSupportUrl(home, component, instance),
      "utf8",
    ),
  );
