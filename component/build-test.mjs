import { home } from "./home.mjs";
import { routeAsync } from "./route.mjs";
import { writeEslintAsync } from "./eslint.mjs";
await routeAsync(home, "test", {});
await writeEslintAsync(home);
