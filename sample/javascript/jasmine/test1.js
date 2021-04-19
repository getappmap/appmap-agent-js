console.log("begin file");
describe("block", function() {
  console.log("begin block");
  it("test1", function(done) {
    console.log("begin test1");
    setTimeout(() => {
      console.log("end test1");
      done();
    }, 200);
  });
  it("test2", function(done) {
    console.log("begin test2");
    setTimeout(() => {
      console.log("end test2");
      done();
    }, 200);
  });
  console.log("end block");
});
console.log("end file");
