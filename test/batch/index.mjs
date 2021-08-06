import testMetadataAsync from "./metadata.mjs";
import testClassmapAsync from "./classmap.mjs";
import testEventApplyAsync from "./event-apply.mjs";
import testEventHttpAsync from "./event-http.mjs";
import testEventQueryAsync from "./event-query.mjs";

const testAsync = async () => {
  await testMetadataAsync();
  await testClassmapAsync();
  await testEventApplyAsync();
  await testEventHttpAsync();
  await testEventQueryAsync();
};

testAsync();
