import testMetadataAsync from "./metadata.mjs";
import testClassmapAsync from "./classmap.mjs";
import testEventApplyAsync from "./event-apply.mjs";
import testEventHttpAsync from "./event-http.mjs";
import testEventQueryAsync from "./event-query.mjs";

const testAsync = async (protocol) => {
  await testMetadataAsync(protocol);
  await testClassmapAsync(protocol);
  await testEventApplyAsync(protocol);
  await testEventHttpAsync(protocol);
  await testEventQueryAsync(protocol);
};

await testAsync("tcp");
await testAsync("inline");
