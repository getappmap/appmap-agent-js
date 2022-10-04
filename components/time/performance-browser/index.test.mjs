globalThis.performance = { now: () => 0 };

await import("./index.mjs?env=test");
