console.log("begin load fs.stat");
const fs = require("fs");
describe('fs.readFile', function() {
  console.log("begin describe fs.stat");
  it('should exists', function (done) {
    console.log("begin it fs.stat");
    fs.stat(__filename, "utf8", (error, stat) => {
      console.log("begin callback fs.stat");
      if (error) {
        done(error);
      } else {
        done();
      }
      console.log("end callback fs.stat");
    });
    console.log("end it fs.stat");
  });
  console.log("end describe fs.stat");
});
console.log("end load fs.stat");
