import testMetadataAsync from "./metadata.mjs";
import testClassmapAsync from "./classmap.mjs";
import testEventApplyAsync from "./event-apply.mjs";
import testEventHttpAsync from "./event-http.mjs";
import testEventQueryAsync from "./event-query.mjs";
import testMochaAsync from "./mocha.mjs";

const testAsync = async (mode, protocol) => {
  await testMetadataAsync(mode, protocol);
  await testClassmapAsync(mode, protocol);
  await testEventApplyAsync(mode, protocol);
  await testEventHttpAsync(mode, protocol);
  await testEventQueryAsync(mode, protocol);
  // await testMochaAsync(mode, protocol);
};

await testAsync("remote", "tcp");
await testAsync("local", "tcp");
